import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SELECT_HIDDEN_FIELDS = '+services.password.bcrypt';

export default function (config) {
  return {
    comparePassword: function (givenPassword){
      return new Promise((resolve, reject) => {
        this.collection.findOne({_id: this._id}, { 'services.password.bcrypt': 1 })
        .then((user) => {
          if(user.services.password.bcrypt) {
            bcrypt.compare(givenPassword, user.services.password.bcrypt, (err, isMatch) => {
              return resolve(isMatch);
            })
          } else {
            return reject('Password not set.');
          }
        })
      });
    },
    generateAuthToken: function() {
      const user = this;
      const { TOKEN_EXPIRES, APP_SECRET } = config;
      return new Promise((resolve, reject) => {
        const expiresIn = `${config.loginExpirationInDays.toString()}d`;
        jwt.sign({ userId: user._id }, APP_SECRET, { expiresIn }, (err, token) => {
          //Should calculate expiresAt instead of using below code to get expiresAt?
          jwt.verify(token, APP_SECRET, (err, data) => {
            return resolve({
              userId: user._id,
              token,
              expiresAt: data.exp //FORMAT THIS?
            });
          });
        });
      });
    },

    /**
      * @summary change the current user's password.
      * @param {String!} oldPassword, the user's current password.
      * @param {String!} newPassword, the password to be.
      * @returns {Promise}
    **/
    changePassword: function(oldPassword, newPassword) {
      const user = this;
      return new Promise((resolve, reject) => {
        if (!oldPassword) return reject(new Error('oldPassword must be set.'));
        if (!newPassword) return reject(new Error('newPassword must be set.'));
        if (typeof oldPassword !== 'string') return reject(new Error('oldPassword must be a string.'));
        if (typeof newPassword !== 'string') return reject(new Error('newPassword must be a string.'));
        if (oldPassword === newPassword) return reject(new Error('newPassword cannot be the same as oldPassword.'));
        user.comparePassword(oldPassword).then((isMatch) => {
          if(!isMatch) return reject(new Error('Incorrect password.'));
          bcrypt.genSalt(config.bcryptRounds, (err, salt) => {
            if(err) return next(err);
            bcrypt.hash(newPassword, salt, (hashErr, hash) => {
              if(err) return next(hashErr);
              const update = {
                $set: { "services.password.bcrypt": hash }
              };
              user.update(update).then((res) => {
                return resolve(!!res.nModified);
              });
            });
          });
        });
      });
    },
  }
}

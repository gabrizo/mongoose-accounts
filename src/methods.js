import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import utils from './utils';

export default function (config) {
  return {
    comparePassword: function (givenPassword){
      return new Promise((resolve, reject) => {
        if(this.services.password.bcrypt) {
          return resolve(bcrypt.compareSync(givenPassword, this.services.password.bcrypt));
        }
        const fields = { username: 1, 'services.password.bcrypt': 1 };
        this.collection.findOne({_id: this._id}, fields).then((user) => {
          if(user && user.services && user.services.password && user.services.password.bcrypt) {
            return resolve(bcrypt.compareSync(givenPassword, user.services.password.bcrypt));
          }
          return reject(new Error('Password not set.'));
        });
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
      * @param {String} oldPassword, the user's current password.
      * @param {String} newPassword, the password to be.
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
          const hash = bcrypt.hashSync(newPassword, config.bcryptRounds);
          const update = {
            $set: { "services.password.bcrypt": hash }
          };
          user.services.password.bcrypt = hash;
          user.save().then((res) => {
            return resolve(true)
          })
        });
      });
    },
  };
};

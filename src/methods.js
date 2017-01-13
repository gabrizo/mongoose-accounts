import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default function (config) {
  return {
    comparePassword: function (givenPassword){
      const user = this;
      return new Promise((resolve, reject) => {
        if(user.services.password.bcrypt) {
          bcrypt.compare(givenPassword, user.services.password.bcrypt, (err, isMatch) => {
            return resolve(isMatch);
          })
        } else {
          return reject('Password not set.');
        }
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
  }
}

import bcrypt from 'bcrypt';

export default function (options) {
  return {
    comparePassword: function (givenPassword){
      const user = this;
      return new Promise((resolve, reject) => {
        if(user.services.password.bcrypt) {
          bcrypt.compare(givenPassword, user.services.password.bcrypt, (err, isMatch) => {
            if(err) return reject(err);
            return resolve(isMatch);
          })
        } else {
          return reject('Password not set');
        }
      });
    },
    changePassword: () => {
      console.log('hi');
    },
    setPassword: () => {
      console.log('password')
    }
  }
}

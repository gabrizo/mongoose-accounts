export default function (config) {
  return {
    createUser: function(options) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(typeof options !== "object") {
          return reject(new Error("Expected an object."));
        }

        const email = options.email;
        const username = options.username;
        const password = options.password;

        if(!username && !email) {
          return reject(new Error('Username or email must be set.'));
        }

        if(!username && config.USERNAME_IS_REQUIRED) {
          return reject(new Error("Username address is required."));
        }

        if(!email && config.EMAIL_IS_REQUIRED) {
          return reject(new Error("Email address is required."));
        }

        const user = { services: {} };

        if(email) {
          User.findOne({ "emails.address": email }, (err, doc) => {
            if(err) return reject(err);
            if(doc) return reject(new Error("Email is already taken."));
          })
          user.emails = [{ address: email, verified: false} ];
        }

        if(username) {
          User.findOne({ "username": username }, (err, doc) => {
            if(err) return reject(err);
            if(doc) return reject(new Error("Username is already taken."));
          })
          user.username = username
        }

        if(password) {
          user.services.password = { bcrypt:  password };
        }

        User.create(user, (err, doc) => {
          if(err) {
            return reject(err)
          }
          return resolve(doc);
        })

      })
    }
  }
}

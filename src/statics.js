const SELECT_HIDDEN_FIELDS = '+services.password.bcrypt';

export default function (config) {
  return {
    createUser: function(options, autoLogin = config.AUTO_LOGIN) {
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
          return reject(new Error("Username is required."));
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
        User.create(user)
        .then(({_id}) => {
          if(autoLogin) {
            return User.findOne({ _id }).exec().then((user) => {
              return user.generateAuthToken().then((res) => {
                return resolve(res);
              })
            })
          }
          return resolve({ userId: _id });
        })
      })
    },
    findByUsername: function (username) {
      const User = this;
      return new Promise((resolve, reject) => {
        const query = { username: `${username}` };
        User.findOne(query, (err, doc) => {
          if(err) return reject(err);
          return resolve(doc);
        })
      })
    },
    loginWithPassword: function(selector, password) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(!selector) {
          return reject(new Error('User must be set.'));
        }

        if(!password) {
          return reject(new Error('Password must be set.'));
        }

        if (typeof selector === "string" ) {
          if (selector.indexOf("@") === -1) {
            selector = { username: selector }
          } else {
            selector = { "emails.address": selector }
          }
        }

        User.findOne(selector).select(SELECT_HIDDEN_FIELDS).exec().then((user) => {
          if(!user) { return reject(new Error('User not found.'))}
          user.comparePassword(password).then((isMatch) => {
            if(isMatch) {
              return user.generateAuthToken();
            }
            return reject(new Error('Incorrect password.'));
          })
        })
      })
    },
  }
}

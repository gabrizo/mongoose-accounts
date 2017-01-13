import { find } from 'lodash';

export default function (config) {
  const SELECT_HIDDEN_FIELDS = '+services.password.bcrypt';
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
        return User.create(user).then((user) => {
          if(autoLogin) {
            return resolve(user.generateAuthToken());
          }
          return resolve({ userId: user._id });
        });
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
            if(isMatch) return resolve(user.generateAuthToken());
            return reject(new Error('Incorrect password.'));
          });
        });
      });
    },
    addEmail: function(userId, newEmail, verified = false) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(!userId) return reject((new Error("userId must be set.")));
        if(!newEmail) return reject((new Error("Email must be set.")));

        const query = {_id: userId };
        const emailQuery = { "emails.address": newEmail };
        const update = {
          $addToSet: {
            emails: {
              address: newEmail,
              verified: verified
            }
          }
        };

        User.findOne(emailQuery).exec().then((user) => {
          if(user)  return reject(new Error("Email is already taken."))
        });

        User.findOne(query).exec().then((user) => {
          if(!user) return reject(new Error("User not found."));
        })
        return resolve(User.update(query, update));

      });
    },
    removeEmail: function(userId, address) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(!userId) return reject((new Error("userId must be set.")));
        if(!address) return reject((new Error("Email must be set.")));

        const emailNotFound = "Email not found.";
        const query = {_id: userId };
        const emailQuery = { "emails.address": address };
        const pull = {
          $pull: {
            emails: { address: "address" }
          }
        }
        User.findOne(query).exec().then((user) => {
          if(!user) return reject(new Error("User not found."));
          const { emails } = user;
          if(!emails) return reject(new Error(emailNotFound));
          const email = find(emails, { address: address } );
          if(!email) return reject(new Error(emailNotFound));
          if(emails.length <= 1) return reject(Error("Emails needs to be greater than one."));
          User.update(query, pull).then((res) => {
            return resolve(true);
          })
          .catch((e) => {
            return resolve(false);
          });
        });

          // User.findOne(emailQuery).exec().then((user) => {
          //   console.log(user);
          //   if(!user) return reject(new Error("Email not found."))
          // });

        // return resolve(User.update(query, pull));

      });
    }
  }
}

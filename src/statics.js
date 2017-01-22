import { find } from 'lodash';
import Chance from 'chance';
import utils from './utils';
import bcrypt from 'bcrypt';
const chance = new Chance();

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
          user.services.password = { bcrypt: bcrypt.hashSync(password, config.bcryptRounds)};
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

        return User.findOne(selector).select(SELECT_HIDDEN_FIELDS).exec().then((user) => {
          if(!user) { return reject(new Error('User not found.'))}
          return user.comparePassword(password).then((isMatch) => {
            if(isMatch) return resolve(user.generateAuthToken());
            return reject(new Error('Incorrect password.'));
          }).catch((e) => {
            return reject(e);
          })
        });
      });
    },
    addEmail: function(userId, newEmail, verified = false) {
      const User = this;
      return new Promise((resolve, reject) => {
        if (!userId) return reject((new Error("userId must be set.")));
        if (!newEmail) return reject((new Error("Email must be set.")));
        if (!utils.isEmail(newEmail)) return reject(new Error("Email is not valid."));
        const query = {_id: userId };
        const emailQuery = { "emails.address": newEmail };
        const verificationToken = {
          address: newEmail,
          token: new Chance(),
        };
        const update = {
          $addToSet: {
            emails: {
              address: newEmail,
              verified: verified
            },
          },
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
        if(!utils.isEmail(address)) return reject(new Error('Invalid email address.'));
        const emailNotFound = "Email not found.";
        const query = {_id: userId };
        const emailQuery = { "emails.address": address };
        const pull = {
          $pull: {
            emails: { address }
          }
        }
        User.findOne(query).exec().then((user) => {
          if(!user) return reject(new Error("User not found."));
          const { emails } = user;
          if(!emails) return reject(new Error(emailNotFound));
          const email = find(emails, { address: address } );
          if(!email) return reject(new Error(emailNotFound));
          if(emails.length <= 1) return reject(Error("Emails needs to be greater than one."));
          User.update(query, pull).then(({nModified}) => {
            return resolve(!!nModified);
          });
        });
      });
    },
    setUsername: function(userId, username) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(!userId) return reject(new Error("userId must be set."));
        if(!username) return reject(new Error("username must be set."));
        User.findById(userId).exec().then((user) => {
          if (!user) return reject(new Error("User not found."));
          User.findOne({ username }).exec().then((user) => {
            if(user) return reject(new Error("Username is already taken."));
            const query = { _id: userId };
            const setUsernameQuery = { $set: { username: username }};
            User.update(query, setUsernameQuery).exec()
            .then(({nModified}) => {
              return resolve(!!nModified);
            });
          });
        });
      });
    },
    getEmailVerificationToken: function(email) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(!email) return reject(new Error("Email must be set."));
        if(!utils.isEmail(email)) return reject(new Error('Invalid email address.'));
        const findQuery = { "emails.address": email };
        User.findOne(findQuery).exec().then((user) => {
          if(!user) return reject(new Error("User not found."));
          const token = chance.apple_token();
          const verificationToken = {
            address: email,
            token
          };
          const updateQuery = { _id: user._id };
          const push = {
            $push: {
              'services.email.verificationTokens': verificationToken
            }
          };
          User.update(updateQuery, push).then(({nModified}) => {
            const result = !!nModified ? token : null;
            return resolve(result);
          })
        })
      })
    },

    //findUserByQuery
    /**
      * @summary find one user using the given query
      * @param {Object} query, mandatory object.
      * @returns {Promise}
    **/
    findUserByQuery: function(query){
      const User = this;
      return new Promise((resolve, reject) => {
        if(!query) return reject( new Error('Query must be set.'));
        if(typeof query !== 'object') return reject( new Error('Expected an object.'));
        return resolve(User.findOne(query));
      })
    }
  };
};

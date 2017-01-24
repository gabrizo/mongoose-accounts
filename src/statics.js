import { find } from 'lodash';
import Chance from 'chance';
import utils from './utils';
import bcrypt from 'bcrypt';
const chance = new Chance();

export default function (config) {
  const SELECT_HIDDEN_FIELDS = '+services.password.bcrypt';
  return {

    //createUser
    /**
      * @summary create a user.
      * @param {Object} args, mandatory object, username or email must be set.
      * @param {Object} options, override schema configuration.
      * @returns {Promise}
    **/
    createUser: function(args, options = {}) {
      const User = this;
      return new Promise((resolve, reject) => {
        if(typeof args !== "object") {
          return reject(new Error("Expected an object."));
        }
        const email = args.email;
        const username = args.username;
        const password = args.password;
        const autoLogin = options.autoLogin || config.AUTO_LOGIN;
        let emailIsRequired = config.EMAIL_IS_REQUIRED;
        let usernameIsRequired = config.USERNAME_IS_REQUIRED;

        if(!username && !email) {
          return reject(new Error('Username or email must be set.'));
        }
        if(typeof options.emailIsRequired === 'boolean') {
          emailIsRequired = options.emailIsRequired;
        }
        if(typeof options.usernameIsRequired === 'boolean') {
          usernameIsRequired = options.usernameIsRequired;
        }
        if(!username && usernameIsRequired) {
          return reject(new Error("Username is required."));
        }
        if (!email && emailIsRequired) {
          return reject(new Error("Email address is required."));
        }
        const user = { services: {} };
        if(!!email) {
          User.findUserByEmail(email).then((doc) => {
            if(doc) return reject(new Error("Email is already taken."));
          });
          user.emails = [{ address: email, verified: false} ];
        }
        if(!!username) {
          User.findUserByUsername(username).then((doc) => {
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
    //findUserByUsername
    /**
      * @summary takes a username and returns a user.
      * @param {String} username, username to query.
      * @return {Promise}
    **/
    findUserByUsername: function (username) {
      return Promise.resolve(this.findUserByQuery({ username }));
    },
    //loginWithPassword
    /**
      * @summary Login with password.
      * @param {Object} selector, email, username or a query to find the user.
      * @param { String} password, plain text password to verify against the database.
    **/
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
    //addEmail
    /**
      * @summary remove an email address from a user document.
      * @param {String} userId, _id of the user.
      * @param {String} newEmail, email address to add.
      * @param {Boolean} verified, should the new address be marked as verified, defaults to false.
    **/
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
    //removeEmail
    /**
      * @summary remove an email address from a user document.
      * @param {String} userId, _id of the user.
      * @param {String} address, email address to remove.
      * @return {Promise}
    **/
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
          const email = find(emails, { address: address } );
          if(!email) return reject(new Error(emailNotFound));
          if(emails.length <= 1) return reject(Error("Emails needs to be greater than one."));
          User.update(query, pull).then(({nModified}) => {
            return resolve(!!nModified);
          });
        });
      });
    },
    //setUsername
    /**
      * @summary set a username
      * @param {String} userId, the collection _id to set the username
      * @param {String} username, the actual username to apply;
      * @return {Promise}
    **/
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
    //getEmailVerificationToken
    /**
      * @summary generates an email verification token
      * @param {String} email.
      * @returns {Promise}
    **/
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
          User.update(updateQuery, push).then(() => {
            return resolve(token)
          });
        });
      });
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
    },
    //findUserByEmail
    /**
      * @summary find one user using the given query
      * @param {String} email, mandatory object.
      * @returns {Promise}
    **/
    findUserByEmail: function(email){
      const User = this;
      return new Promise((resolve, reject) => {
        if(!email) return reject( new Error('Email must be set.'));
        if(!utils.isEmail(email)) return reject( new Error('Invalid email address.'));
        const query = { "emails.address": email };
        return resolve(User.findUserByQuery(query));
      })
    }
  };
};

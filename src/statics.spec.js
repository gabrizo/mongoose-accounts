import AccountPlugin from './index.js';
import { setupTest } from '../test/test-helper';
import mongoose, { Schema } from 'mongoose';

setupTest();

mongoose.Promise = global.Promise;

const UserSchema = new Schema({
  mobile: String
});

UserSchema.plugin(AccountPlugin, {
  EMAIL_IS_REQUIRED: true,
  USERNAME_IS_REQUIRED: true,
});

const Accounts = mongoose.model("User", UserSchema);

describe('Accounts', () => {

  beforeEach(() => {
    setupTest();
  })
  describe('#createUser()', () => {
    it('should reject if username or email is not provided', async () => {
      return Accounts.createUser({ password: "password" } )
      .catch((e) => {
        expect(e.message).toEqual('Username or email must be set.')
      })
    });
    it('should only accept an object as args', () => {
      return Accounts.createUser("foo@example.com")
      .catch((e) => {
        expect(e.message).toEqual("Expected an object.");
      })
    });
    it('should reject if email already exists', async () => {
      const userObj = { username: "xxxxAsa", password: "sekret", email: "bar_x@example.com" };
      const userObj2 = { username: "foxAsa", password: "sekret", email: "bar_x@example.com" };
      const user = await Accounts.createUser(userObj);
      return Accounts.createUser(userObj2)
      .catch((e) => {
        expect(e.message).toEqual("Email is already taken.");
      })
    });
    it('should reject if username already exists', async () => {
      const userObj = { password: "sekret", username: "userX", email: "userX@example.com" };
      const userObj2 = { password: "sekret", username: "userX", email: "userX2@example.com" };
      const user = await Accounts.createUser(userObj);
      return Accounts.createUser(userObj2)
      .catch((e) => {
        expect(e.message).toEqual("Username is already taken.");
      })
    });
    it('should create a new user', () => {
      Accounts.createUser({
        email: "foo@example.com",
        username: "foobar",
        password: "password123"
      }).then((user) => {
        expect(user._id).toBeDefined();
      })
    });
    it('should reject if email is null and EMAIL_IS_REQUIRED is to true', () => {
      Accounts.createUser({
        username: "userFoo",
        password: "userPassword221"
      })
      .catch((e) => {
        expect(e.message).toEqual("Email address is required.")
      })
    });
    it('should reject if username is null and USERNAME_IS_REQUIRED is to true', () => {
      Accounts.createUser({
        email: "userFoo@example.com",
        password: "userPassword221"
      })
      .catch((e) => {
        expect(e.message).toEqual("Username is required.")
      })
    })
  });
});

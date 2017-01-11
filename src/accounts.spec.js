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
const testUser = {
  username: "gcontra",
  email: "gcontra@example.com",
  password: "password@123"
};

describe('Accounts', () => {

  beforeEach(() => {
    setupTest();
  })

  it('should hash password before save', () => {
    const user = new Accounts({ username: "user1", "services.password.bcrypt": "password"});
    user.save((err, doc) => {
      expect(doc.services.password.bcrypt).toBeDefined();
      expect(doc.services.password.bcrypt).not.toBe("password");
    })
  });

  describe('Statics', () => {
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
        }).then((result) => {
          expect(result.userId).toBeDefined();
          expect(result.token).toBeDefined();
          // expect(result.token).not.toBeNull();
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
    }); //createUser
    describe('findByUsername', () => {
      it('should return a user', async () => {
        const newUser = await Accounts.createUser(testUser);
        const user = await Accounts.findByUsername(testUser.username);
        expect(newUser.userId).toEqual(user._id);
      });
      it('should return null if the username is not found', async () => {
        const user = await Accounts.findByUsername({ username: "does_not_exit"});
        expect(user).toBeNull();
      })
    })
  }); //Statics
  describe('Methods', () => {
    describe('comparePassword',  async () => {
      it("it should return false if the password is incorrect", async () => {
        await Accounts.createUser(testUser);
        Accounts.findOne({ username: testUser.username }, async (err, user) => {
          user.comparePassword("randomPassword").then((isMatch) => {
            expect(isMatch).toBeFalsy();
          })
        })
      });
      it("it should return true if the password correct", async () => {
        Accounts.findOne({ username: testUser.username }, async (err, user) => {
          user.comparePassword(testUser.password).then((isMatch) => {
            expect(isMatch).toBeTruthy();
          })
        })
      });
    })
  });

});

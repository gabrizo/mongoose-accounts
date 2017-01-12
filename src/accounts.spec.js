import AccountPlugin from './index.js';
import { setupTest } from '../test/test-helper';
import mongoose, { Schema } from 'mongoose';

setupTest();

mongoose.Promise = global.Promise;

const UserSchema = new Schema({
  mobile: String
}, {
  timestamps: true
});

UserSchema.plugin(AccountPlugin, {
  EMAIL_IS_REQUIRED: true,
  USERNAME_IS_REQUIRED: true,
  AUTO_LOGIN: true
});

const Accounts = mongoose.model("User", UserSchema);

describe('Accounts', () => {
  beforeEach(() => {
    setupTest();
    // myCreateUser();
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
        return Accounts.createUser("foo_bar@example.com")
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
          email: "foo_jane@example.com",
          username: "foobar",
          password: "password123"
        }).then((result) => {
          expect(result.userId).toBeDefined();
        })
      });
      it('should create a new user and generateAuthToken if AUTO_LOGIN', () => {
        Accounts.createUser({
          email: "jane_doe@example.com",
          username: "jane_doe",
          password: "password123"
        }, true).then((result) => {
          expect(result.userId).toBeDefined();
          expect(result.token).toBeDefined();
          expect(result.token).not.toBeNull();
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
    describe('findByUsername',() => {
      it('should return a user', async () => {
        const _user = {
          username: "breezy",
          email: "breezy@example.com",
          password: "password"
        };
        const newUser = await Accounts.createUser(_user);
        const user = await Accounts.findByUsername(_user.username);
        expect(newUser.userId).toEqual(user._id);
      });
      it('should return null if the username is not found', async () => {
        const user = await Accounts.findByUsername({ username: "does_not_exit"});
        expect(user).toBeNull();
      });
    });
    describe('loginWithPassword', () => {
      it('should fail user is undefined.', () => {
        return Accounts.loginWithPassword()
        .catch((e) => {
          expect(e.message).toEqual('User must be set.');
        });
      });
      it('should fail if password is not provided', () => {
        return Accounts.loginWithPassword({email: "s"})
        .catch((e) => {
          expect(e.message).toEqual('Password must be set.');
        });
      });
      it('should fail if the user does not exist', () => {
        return Accounts.loginWithPassword('randomUsername', 'password')
        .catch((e) => {
          expect(e.message).toEqual('User not found.');
        });
      });
      it("should fail if the password is in incorrect.",async () => {
        const _user = {
          username: "gabara",
          email: "gabara@example.com",
          password: "password"
        }
        await Accounts.createUser(_user);
        Accounts.loginWithPassword(_user.email, "randomPassword")
        .catch((e) => {
          expect(e.message).toEqual('Incorrect password.');
        });
      });
      it("should authenticate.",async () => {
        const _user = {
          username: "gabara2",
          email: "gabara2@example.com",
          password: "password"
        }
        await Accounts.createUser(_user);
        Accounts.loginWithPassword(_user.email, _user.password, true)
        .then((res) => {
          expect(res.userId).toBeDefined();
          expect(res.token).toBeDefined();
        })
      });
    });
  }); //Statics
  describe('Methods', () => {
    describe('comparePassword',  async () => {
      const HIDDEN_FIELDS = '+services.password.bcrypt';
      it("it should return false if the password is incorrect", async () => {
        await Accounts.createUser({username: "user", email: "mw@exma.com", password: 'password'});
        Accounts.findOne({username: "user"}).select(HIDDEN_FIELDS).exec()
        .then((user) => {
          user.comparePassword("randomPassword").then((isMatch) => {
            expect(isMatch).toBeFalsy();
          })
        })
      });
      it("it should return true if the password correct", async () => {
        await Accounts.createUser({username: "exists", email: "exists@exma.com", password: 'password'});
        Accounts.findOne({username: "exists"}).select(HIDDEN_FIELDS).exec()
        .then((user) => {
          user.comparePassword("password").then((isMatch) => {
            expect(isMatch).toBeTruthy();
          })
        })
      });
    }); //comparePassword
    describe("generateAuthToken", () => {
      it('should generate a token', async () => {
        const _user = {
          username: "usernameXX",
          password: "MyPassword___XX@12",
          email: "__email@foobar.net"
        }
        await Accounts.createUser(_user);
        const user =  await Accounts.findByUsername(_user.username);
        user.generateAuthToken()
        .then((res) => {
          expect(res.token).toBeDefined();
          expect(res.expiresAt).toBeDefined();
          expect(res.userId).toBeDefined();
        })
      })
    })
  });
});

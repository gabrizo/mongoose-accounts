import { setupTest } from '../test/mongoose-connection';
import { Accounts, createTestUser, removeAllUsers } from '../test/user';
import { Types } from 'mongoose';

const HIDDEN_FIELDS = '+services.password.bcrypt';
removeAllUsers();
createTestUser();

describe('Accounts', () => {
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
          expect(e).toBeDefined();
        })
      });
      it('should reject if username already exists', async () => {
        const userObj = { password: "sekret", username: "gabrizo", email: "user3@example.com" };
        return Accounts.createUser(userObj)
        .catch((e) => {
          expect(e).toBeDefined();
        });
      });
      it('should create a new user', () => {
        return Accounts.createUser({
          email: "foo_jane@example.com",
          username: "foobar",
          password: "password123"
        }).then((result) => {
          expect(result.userId).toBeDefined();
        })
      });
      it('should create a new user and return auth token if autoLogin is set to true', () => {
        const user = { email: "john@example.com",username: "john_doe",password: "password123"};
        return Accounts.createUser(user, true)
        .then((result) => {
          expect(result.userId).toBeDefined();
          expect(result.token).toBeDefined();
        })
      });
      it('should create a new user and generateAuthToken if AUTO_LOGIN is set to true', () => {
        const options = {
          email: "jane_doe@example.com",
          username: "jane_doe",
          password: "password123"
        };
        return Accounts.createUser(options, true).then((res) => {
          expect(res.userId).toBeDefined();
          expect(res.token).toBeDefined();
          expect(res.token).not.toBeNull();
        });
      });
      it('should reject if email is null and EMAIL_IS_REQUIRED is to true', () => {
        return Accounts.createUser({
          username: "userFoo",
          password: "userPassword221"
        })
        .catch((e) => {
          expect(e.message).toEqual("Email address is required.")
        })
      });
      it('should reject if username is null and USERNAME_IS_REQUIRED is to true', () => {
        return Accounts.createUser({
          email: "userFoo@example.com",
          password: "userPassword221"
        })
        .catch((e) => {
          expect(e.message).toEqual("Username is required.")
        })
      })
    }); //createUser

    describe('removeEmail', () => {
      it('should reject is if userId is null', () => {
        return Accounts.removeEmail()
        .catch((e) => {
          expect(e.message).toEqual('userId must be set.');
        });
      });
      it('should reject if email is not provided', () => {
        Accounts.removeEmail("userId").catch((e) => expect(e.message).toEqual('Email must be set.'));
      });
      it('should reject if the user is does not exist', () => {
        const userId = Types.ObjectId();
        return Accounts.removeEmail(userId, "random@example.com")
        .catch((e) =>  {
          expect(e.message).toEqual("User not found.");
        });
      });
      it('should reject is no email is not found.', async () => {
        const user = await Accounts.findByUsername("gabrizo");
        return Accounts.removeEmail(user._id, "random_remove_email@example.com")
        .catch((e) => {
          expect(e.message).toEqual("Email not found.");
        });
      });
      it('should reject if email length is 1', async () => {
        const user = await Accounts.findByUsername("gabrizo");
        return Accounts.removeEmail(user._id, user.emails[0].address)
        .catch((e) =>  {
          expect(e.message).toEqual("Emails needs to be greater than one.")
        });
      });
      it('should remove emails', async () => {
        const user = await Accounts.findByUsername("gabrizo");
        const email = "email_to_remove@example.com";
        await Accounts.addEmail(user._id, email);
        return Accounts.removeEmail(user._id, email)
        .then((res) =>  {
          expect(res).toBeTruthy();
        });
      });
    }); //removeEmail

    describe('addEmail', () => {
      it('should reject if userId is empty', async () => {
        return Accounts.addEmail()
        .catch((e) => {
          expect(e.message).toEqual("userId must be set.");
        });
      });
      it('should reject if newEmail is empty', async () => {
        return Accounts.addEmail("ObjectId(XXXXX)")
        .catch((e) => {
          expect(e.message).toEqual("Email must be set.");
        });
      });
      it('should reject if the userId is not valid', async() => {
        return Accounts.addEmail("XXXXXXXXXXXX", "me_@example.com")
        .catch((e) => {
          console.log(e.message);
          expect(e.message).toEqual("User not found.");
        })
      })
      it('should add a new mail', async () => {
        const user =  await Accounts.findByUsername("gabrizo");
        return Accounts.addEmail(user._id, "newEmail@example.com").then((res) => {
          expect(res).toBeTruthy();
        });
      });
      it('should reject if mail already exists', async () => {
        const user =  await Accounts.findByUsername("gabrizo");
        const newEmail = user.emails[0].address;
        return Accounts.addEmail(user._id, newEmail)
        .catch((e) => {
          expect(e).toBeDefined()
        })
      });
    });

    describe('findByUsername',() => {
      it('should return a user', async () => {
        const user = await Accounts.findByUsername("gabrizo");
        expect(user.username).toEqual("gabrizo");
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
        return Accounts.loginWithPassword("gabrizo", "randomPassword")
        .catch((e) => {
          expect(e.message).toEqual('Incorrect password.');
        });
      });
      it("should authenticate with a username.", () => {
        return Accounts.loginWithPassword("gabrizo", 'Password')
        .then((res) => {
          expect(res.userId).toBeDefined();
          expect(res.token).toBeDefined();
        })
      });
      it("should authenticate with an email.", () => {
        return Accounts.loginWithPassword("gabrizo@example.com", 'Password')
        .then((res) => {
          expect(res.userId).toBeDefined();
          expect(res.token).toBeDefined();
        })
      });
    });

    describe("setUsername", () => {
      it('should reject if userId is empty', () => {
        return Accounts.setUsername()
        .catch((e) => {
          expect(e.message).toEqual('userId must be set.');
        });
      });
      it('should reject if username is empty', () => {
        const userId = Types.ObjectId()
        return Accounts.setUsername(userId)
        .catch((e) => {
          expect(e.message).toEqual('username must be set.');
        });
      });
      it('should reject if user does not exists', () => {
        const userId = Types.ObjectId();
        return Accounts.setUsername(userId, "newUsername")
        .catch((e) => {
          expect(e.message).toEqual('User not found.');
        });
      });
      it('should reject if username is already taken', async () => {
        const user = await Accounts.findByUsername("gabrizo");
        const { _id, username } = user;
        return Accounts.setUsername(_id, username)
        .catch((e) => {
          expect(e.message).toEqual('Username is already taken.');
        });
      });
      it('should update username', async () => {
        const _user = {
          username: "breezy",
          email: "breezy_@example.com",
          password: "PAssswprd"
        };
        await Accounts.createUser(_user);
        const user = await Accounts.findByUsername("breezy");
        const { _id, username } = user;
        return Accounts.setUsername(_id, "new_username1020")
        .then((res) => {
          expect(res).toBeTruthy();
        })
      });
    });//setUsername

    describe('getEmailVerificationToken', () => {
      it('should reject if email is empty.', () => {
        return Accounts.getEmailVerificationToken()
        .catch((e) => {
          expect(e.message).toEqual('Email must be set.')
        });
      });
      it('should reject if email is not valid', () => {
        return Accounts.getEmailVerificationToken("invalid_email@")
        .catch(({message}) => {
          expect(message).toEqual('Invalid email address.');
        });
      });
      it('should fail if email address does not exists', () => {
        return Accounts.getEmailVerificationToken("someRandomEmail@example.com")
        .catch(({message}) => {
          expect(message).toEqual('User not found.');
        });
      });
      it('should return a token', () => {
        return Accounts.getEmailVerificationToken("gabrizo@example.com")
        .then((token) => {
          expect(typeof token).toEqual("string");
        });
      });
    }); //getEmailVerificationToken
  }); //Statics

  describe('Methods', () => {
    describe('comparePassword',  async () => {
      it("it should return false if the password is incorrect", async () => {
        return Accounts.findOne({username: "gabrizo"}).select(HIDDEN_FIELDS).exec()
        .then((user) => {
          user.comparePassword("randomPassword").then((isMatch) => {
            expect(isMatch).toBeFalsy();
          })
        })
      });
      it("it should return true if the password correct", async () => {
        return Accounts.findOne({username: "gabrizo"}).select(HIDDEN_FIELDS).exec()
        .then((user) => {
          user.comparePassword("Password").then((isMatch) => {
            expect(isMatch).toBeTruthy();
          })
        })
      });
    }); //comparePassword
    describe("generateAuthToken", () => {
      it('should generate a token', async () => {

        const user =  await Accounts.findByUsername("gabrizo");
        return user.generateAuthToken()
        .then((res) => {
          expect(res.token).toBeDefined();
          expect(res.expiresAt).toBeDefined();
          expect(res.userId).toBeDefined();
        })
      })
    });
  });
});

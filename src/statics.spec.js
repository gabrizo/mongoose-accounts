import { setupTest } from '../test/mongoose-connection';
import { Accounts, createTestUser, removeAllUsers } from '../test/user';
import { Types } from 'mongoose';

removeAllUsers();
const HIDDEN_FIELDS = '+services.password.bcrypt';
  describe('Statics', () => {
    let _user;
    beforeEach( async () => {
      await Accounts.remove({});
      await Accounts.createUser({
        username: "maanda",
        email: "maanda@example.com",
        password: "Password",
      });
      _user = await Accounts.findOne({username: "maanda"}).exec();
    });


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
      return Accounts.removeEmail(userId, "maanda@example.com")
      .catch((e) =>  {
        expect(e.message).toEqual("User not found.");
      });
    });
    it('should reject is no email is not found.', async () => {
      return Accounts.removeEmail(_user._id, "random_remove_email@example.com")
      .catch((e) => {
        expect(e.message).toEqual("Email not found.");
      });
    });
    it('should reject if email length is 1', async () => {
      return Accounts.removeEmail(_user._id, _user.emails[0].address)
      .catch((e) =>  {
        expect(e.message).toEqual("Emails needs to be greater than one.")
      });
    });
    it('should reject if email is invalid', async () => {
      return Accounts.removeEmail(_user._id, "invalid_email")
      .catch((e) =>  {
        expect(e.message).toEqual('Invalid email address.')
      });
    });
    it('should remove email', async () => {
      const email = "email_to_remove@example.com";
      await Accounts.addEmail(_user._id, email);
      return Accounts.removeEmail(_user._id, email).then((removed) => {
        expect(removed).toBeTruthy();
      });
    });
  }); //removeEmail

  describe('addEmail', () => {
    it('should reject if userId is empty', () => {
      return Accounts.addEmail().catch((e) => {
        expect(e.message).toEqual("userId must be set.");
      });
    });
    it('should reject if newEmail is empty', () => {
      return Accounts.addEmail("ObjectId(XXXXX)")
      .catch((e) => {
        expect(e.message).toEqual("Email must be set.");
      });
    });
    it('should reject if email is not valid', () => {
      return Accounts.addEmail(_user._id, 'email_is_invalid').catch((e) => {
        expect(e.message).toEqual('Email is not valid.');
      });
    });
    it('should reject if the userId is not found', async() => {
      return Accounts.addEmail("XXXXXXXXXXXX", "me_@example.com").catch((e) => {
        expect(e.message).toEqual("User not found.");
      });
    });
    it('should add a new mail', async () => {
      return Accounts.addEmail(_user._id, "newEmail@example.com").then((added) => {
        expect(added).toBeTruthy();
      });
    });
    it('should reject if mail already exists', async () => {
      const newEmail = _user.emails[0].address;
      return Accounts.addEmail(_user._id, newEmail).catch((e) => {
        expect(e).toBeDefined()
      });
    });
  });

  describe('findByUsername',() => {
    it('should return a user', async () => {
      const user = await Accounts.findByUsername("maanda");
      expect(user.username).toEqual("maanda");
    });
    it('should return null if the username is not found',() => {
      Accounts.findByUsername({ username: "does_not_exit"}).then((user) => {
        expect(user).toBeNull();
      });
    });
  });

  describe('loginWithPassword', () => {
    it('should fail user is undefined.', () => {
      return Accounts.loginWithPassword().catch((e) => {
        expect(e.message).toEqual('User must be set.');
      });
    });
    it('should reject if password is not set', async () => {
      const _user = {
        email: "me_and_i@example.com",
        username: "me_and_i"
      };
      await Accounts.createUser(_user);
      return Accounts.loginWithPassword("me_and_i", "password")
      .catch((e) => {
        expect(e.message).toEqual('Password not set.');
      })
    })
    it('should fail if password is not provided', () => {
      return Accounts.loginWithPassword({email: "s"}).catch((e) => {
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
      return Accounts.loginWithPassword("maanda", "randomPassword").catch((e) => {
        expect(e.message).toEqual('Incorrect password.');
      });
    });
    it("should authenticate with a username.", () => {
      return Accounts.loginWithPassword("maanda", 'Password')
      .then((res) => {
        expect(res.userId).toBeDefined();
        expect(res.token).toBeDefined();
      })
    });
    it("should authenticate with an email.", () => {
      return Accounts.loginWithPassword("maanda@example.com", 'Password')
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
    it('should reject if username is already taken', () => {
      const { _id, username } = _user;
      return Accounts.setUsername(_id, username).catch((e) => {
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
      return Accounts.getEmailVerificationToken("maanda@example.com").then((token) => {
        expect(typeof token).toEqual("string");
      });
    });
  }); //getEmailVerificationToken
}); //Statics

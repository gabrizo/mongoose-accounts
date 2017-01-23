import { Accounts, removeAllUsers } from '../test/user';
const HIDDEN_FIELDS = '+services.password.bcrypt';

removeAllUsers();

let _user;

describe('Methods', () => {
  beforeEach( async () => {
    await Accounts.remove({username: "gabrizo" });
    await Accounts.createUser({
      username: "gabrizo",
      email: "gabrizo@example.com",
      password: "Password",
    });
    _user = await Accounts.findOne({username: "gabrizo"}).select(HIDDEN_FIELDS).exec();
  });
  describe('#comparePassword(password)',  async () => {
    it("it should return false if the password is incorrect", () => {
      return _user.comparePassword("randomPassword").then((isMatch) => {
        expect(isMatch).toBeFalsy();
      });
    });
    it("it should return true if the password correct", () => {
      return _user.comparePassword("Password").then((isMatch) => {
        expect(isMatch).toBeTruthy();
      })
    });
    it("it should return true if the password correct and password not selected", async () => {
      const user = await Accounts.findOne({ username: "gabrizo" });
      return user.comparePassword("Password").then((isMatch) => {
        expect(isMatch).toBeTruthy();
      })
    });
  }); //comparePassword
  describe("#generateAuthToken(email)", () => {
    it('should generate a token', () => {
      return _user.generateAuthToken().then((res) => {
        expect(res.token).toBeDefined();
        expect(res.expiresAt).toBeDefined();
        expect(res.userId).toBeDefined();
      });
    });
  });

  describe("#changePassword(oldPassword STRING!, newPassword STRING!)", () => {
    it('should fail if oldPassword is empty', () => {
      return _user.changePassword().catch(({message}) => {
        expect(message).toEqual('oldPassword must be set.');
      });
    });
    it('should fail if newPassword is empty', async () => {
      return _user.changePassword('oldPassword').catch(({message}) => {
        expect(message).toEqual('newPassword must be set.');
      });
    });
    it('should fail if oldPassword is not a string', async () => {
      return _user.changePassword(11111, "password").catch(({message}) => {
        expect(message).toEqual('oldPassword must be a string.');
      });
    });
    it('should fail if newPassword is not a string', async () => {
      return _user.changePassword('oldPassword', 111111).catch(({message}) => {
        expect(message).toEqual('newPassword must be a string.');
      });
    });
    it('should fail is oldPassword and newPassword are the same', async () => {
      return _user.changePassword('Password', 'Password').catch(({message}) => {
        expect(message).toEqual('newPassword cannot be the same as oldPassword.');
      });
    });
    it('should fail if oldPassword does not match current db password', async () => {
      return _user.changePassword('__Password', 'password123').catch(({message}) => {
        expect(message).toEqual('Incorrect password.');
      });
    });
    it('should change password to newPassword', async () => {
      return _user.changePassword('Password', 'password123').then((res) => {
        expect(res).toEqual(true);
      });
    });
  });
})

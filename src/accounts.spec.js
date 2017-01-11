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

  it('should hash password before save', () => {
    const user = new Accounts({ username: "user1", "services.password.bcrypt": "password"});
    user.save((err, doc) => {
      expect(doc.services.password.bcrypt).toBeDefined();
      expect(doc.services.password.bcrypt).not.toBe("password");
    })
  });
});

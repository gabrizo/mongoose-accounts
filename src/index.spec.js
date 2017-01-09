import AccountPlugin from './index.js';
import { setupTest } from '../test/test-helper';
import mongoose, { Schema } from 'mongoose';

setupTest();

const UserSchema = new Schema({
  mobile: String
});

UserSchema.plugin(AccountPlugin, {});

const User = mongoose.model('User', UserSchema);

describe('User', () => {
  it('should hash password before save', () => {
    const user = new User({ username: "user1", password: "password"});
    user.save((err, doc) => {
      expect(doc.password).toBeDefined();
      expect(doc.password).not.toBe("password");
    })
  });
})

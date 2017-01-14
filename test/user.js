import mongoose, { Schema } from 'mongoose';
import AccountsPlugin from '../src/index.js';
// import { setupTest } from './mongoose-connection';

mongoose.connect('mongodb://localhost/mongoose-accounts');
mongoose.Promise = global.Promise;

// setupTest();
const UserSchema = new Schema({
  firstName: String
});

UserSchema.plugin(AccountsPlugin, {
  EMAIL_IS_REQUIRED: true,
  USERNAME_IS_REQUIRED: true,
  // AUTO_LOGIN: true
});


export const Accounts = mongoose.model('User', UserSchema);

export async function createTestUser() {
  Accounts.remove().then(async () => {
    const user = await Accounts.createUser({
      username: "gabrizo",
      email: "gabrizo@example.com",
      password: "Password"
    });
    return user;
  });
}

export async function removeAllUsers() {
  await Accounts.remove({}).exec();
}

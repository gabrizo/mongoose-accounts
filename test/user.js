import mongoose, { Schema } from 'mongoose';
import AccountsPlugin from '../src/index.js';
import { setupTest } from './mongoose-connection';

mongoose.connect('mongodb://localhost/mongoose-accounts');
mongoose.Promise = global.Promise;

setupTest();
const UserSchema = new Schema({
  firstName: String
});

UserSchema.plugin(AccountsPlugin, {
  EMAIL_IS_REQUIRED: true,
  USERNAME_IS_REQUIRED: false,
  // AUTO_LOGIN: true
});


export const Accounts = mongoose.model('User', UserSchema);

export async function removeAllUsers() {
  await Accounts.remove({}).exec();
}

import Chance from 'chance';
import { forEach } from 'lodash';
import bcrypt from 'bcrypt';
import _schema from './schema';
import defaultConfig from './config'
import getStatics from './statics';
import getMethods from './methods';
import uniqueValidator from 'mongoose-unique-validator';

export default function (schema, options) {
  options = Object.assign(defaultConfig, options);
  const userSchema = _schema(options);
  schema.add(userSchema);
  schema.plugin(uniqueValidator, { message: '{PATH} is already taken'})
  //Hash the password before saving;

  // schema.pre('save', function(next) {
  //   const user = this;
  //   if(!user.isModified('services.password.bcrypt')) return next();
  //   bcrypt.genSalt(options.bcryptRounds, (err, salt) => {
  //     if(err) return next(err);
  //     bcrypt.hash(user.services.password.bcrypt, salt, (hashErr, hash) => {
  //       if(err) return next(hashErr);
  //       user.services.password.bcrypt = hash;
  //       return next();
  //     })
  //   })
  // });

  schema.statics = Object.assign(schema.statics, getStatics(options));
  schema.methods = Object.assign(schema.methods, getMethods(options));
}

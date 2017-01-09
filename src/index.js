import bcrypt from 'bcrypt';
import _schema from './schema';
import defaultConfig from './config'

export default function (schema, options) {
  options = Object.assign(options, defaultConfig);
  const userSchema = _schema(options);
  schema.add(userSchema);

  //Hash the password before saving;
  schema.pre('save', function(next) {
    const user = this;
    if(!user.isModified('password')) return next();
    bcrypt.genSalt(options.bcryptRounds, (err, salt) => {
      if(err) return err;
      bcrypt.hash(user.password, salt, (err, hash) => {
        if(err) return err;
        user.password = hash;
        return next();
      })
    })
  })
}

import _schema from './schema';
import defaultConfig from './config'

export default function (schema, options) {
  options = Object.assign(options, defaultConfig);
  const userSchema = _schema(options);
  schema.add(userSchema);
}

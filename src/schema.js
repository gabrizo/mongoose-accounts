export default function (options) {
  return {
    username: {
      type: String,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      index: true
    },
  };
}

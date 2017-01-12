export default function (config) {
  return {
    username: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
      required: config.USERNAME_IS_REQUIRED
    },
    services: {
      password: {
        bcrypt: {
          type: String,
          select: false,
        }
      }
    },
    emails: [{
      address: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        // required: config.EMAIL_IS_REQUIRED
      },
      verified: {
        type: Boolean,
        default: false
      }
    }]
  }
}

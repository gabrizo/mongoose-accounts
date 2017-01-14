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
      },
      email: {
        verificationTokens: [{
          token: {
            type: String,
            unique: true,
            sparse: true
          },
          address: String,
          createdAt: { type: Date, default: new Date() }
        }]
      }
    },
    emails: [{
      address: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        index: true
        // required: config.EMAIL_IS_REQUIRED
      },
      verified: {
        type: Boolean,
        default: false
      }
    }]
  }
}

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'admin must have a first name.'],
    },
    lastName: {
      type: String,
      required: [true, 'admin must have a last name.'],
    },
    userName: {
      type: String,
      required: [true, 'admin must have a user name.'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'admin must have a email.'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password User required.'],
    },
    role: {
      type: String,
      required: [true, 'Role of Admin is required'],
      enum: ['head admin', 'admin'],
      default: 'admin',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

adminSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 14);
  next();
});

adminSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
  },
});

adminSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

adminSchema.methods.checkPasswordChanged = function (JWTTimestamps) {
  if (this.passwordChangedAt) {
    const changedTimestamps = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamps < changedTimestamps;
  }
  return false;
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;

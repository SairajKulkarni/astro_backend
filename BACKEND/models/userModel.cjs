const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.cjs");
const otpGenerator = require("otp-generator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
  },
  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: [validator.isEmail, "Please Enter a valid Email"],
  },
  password: {
    type: String,
    required: [true, "Please Enter Your Password"],
    minLength: [8, "Password should be at least of 8 characters"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "user",
  },
  videos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  payments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  ],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

// We have used async function for encrypting password because insde arrow function we can't use 'this' keyword
userSchema.pre("save", async function (next) {
  // if condition is when we want to update all the fields expect the password otherwise the encrypted password would be encrypted again
  if (!this.isModified("password")) next();

  this.password = await bcrypt.hash(this.password, 10);
});

// JWT TOKEN
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  // Generating a 5-digit numeric OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();

  // Set OTP and expiry in the user schema
  this.resetPasswordToken = otp;
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Return the OTP
  return otp;
};

module.exports = mongoose.model("User", userSchema);

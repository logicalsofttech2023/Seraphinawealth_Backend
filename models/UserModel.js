import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    userEmail: {
      type: String,
      unique: true,
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
    },
    address: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      unique: true,
    },
    aadharNumber: {
      type: String,
    },
    aadharFrontImage: {
      type: String,
      default: "",
    },
    aadharBackImage: {
      type: String,
      default: "",
    },
    panNumber: {
      type: String,
    },
    panFrontImage: {
      type: String,
      default: "",
    },
    panBackImage: {
      type: String,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    firebaseToken: {
      type: String,
    },
    wallet: {
      type: Number,
      default: 0,
    },
    adminVerified: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;

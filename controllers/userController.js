import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/UserModel.js";
import path from "path";
import crypto from "crypto";
import Transaction from "../models/TransactionModel.js";
import { addNotification } from "../utils/AddNotification.js";
import { Policy, FAQ } from "../models/PolicyModel.js";
import BankAccount from "../models/BankAccount.js";

const generateJwtToken = (user) => {
  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const generateSixDigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 4-digit number
};

const generateTransactionId = () => {
  const randomString = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10 characters
  const formattedId = `QV${randomString.match(/.{1,2}/g).join("")}`; // PJ + split into 2-char groups
  return formattedId;
};

export const generateOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        message: "phone, is required",
        status: false,
      });
    }

    let user = await User.findOne({ phone });

    const generatedOtp = generateSixDigitOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (user) {
      user.otp = generatedOtp;
      user.otpExpiresAt = otpExpiresAt;
    } else {
      user = new User({
        phone,
        otp: generatedOtp,
        otpExpiresAt,
      });
    }

    await user.save();

    res.status(200).json({
      message: "OTP generated and sent successfully",
      status: true,
      otp: generatedOtp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, firebaseToken } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        message: "phone, and otp are required",
        status: false,
      });
    }

    let user = await User.findOne({ phone });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP", status: false });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: "OTP expired", status: false });
    }

    user.otpExpiresAt = "";
    user.isVerified = true;
    user.firebaseToken = firebaseToken;
    await user.save();

    let token = "";
    let userExit = false;
    if (user.firstName) {
      token = generateJwtToken(user);
      userExit = true;
    }

    const formattedUser = {
      _id: user._id,
      userEmail: user.userEmail || "",
      phone: user.phone || "",
      profileImage: user.profileImage || "",
      otp: user.otp || "",
      otpExpiresAt: user.otpExpiresAt || "",
      isVerified: user.isVerified,
      role: user.role || "user",
      firebaseToken: firebaseToken || "",
      name: user.name || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      message: "OTP verified successfully",
      status: true,
      token,
      userExit,
      data: formattedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        message: "phone are required",
        status: false,
      });
    }

    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found", status: false });
    }

    const generatedOtp = generateSixDigitOtp();
    user.otp = generatedOtp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    res.status(200).json({
      message: "OTP resent successfully",
      status: true,
      data: generatedOtp,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      userEmail,
      dob,
      gender,
      address,
      phone,
      aadharNumber,
      panNumber,
      firebaseToken,
    } = req.body;

    const files = req.files;
    const profileImage = files?.profileImage?.[0]?.filename || "";
    const aadharFrontImage = files?.aadharFrontImage?.[0]?.filename || "";
    const aadharBackImage = files?.aadharBackImage?.[0]?.filename || "";
    const panFrontImage = files?.panFrontImage?.[0]?.filename || "";
    const panBackImage = files?.panBackImage?.[0]?.filename || "";

    let user = await User.findOne({ phone });

    if (!user || !user.isVerified) {
      return res
        .status(400)
        .json({ message: "User not verified", status: false });
    }

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "First and last names are required", status: false });
    }

    user.firstName = firstName;
    user.middleName = middleName || "";
    user.lastName = lastName;
    user.dob = dob || "";
    user.gender = gender || "";
    user.userEmail = userEmail || "";
    user.address = address || "";
    user.aadharNumber = aadharNumber || "";
    user.panNumber = panNumber || "";
    user.firebaseToken = firebaseToken || "";

    user.profileImage = profileImage;
    user.aadharFrontImage = aadharFrontImage;
    user.aadharBackImage = aadharBackImage;
    user.panFrontImage = panFrontImage;
    user.panBackImage = panBackImage;

    user.isVerified = true;

    await user.save();

    const token = generateJwtToken(user);

    res.status(201).json({
      message: "User registered successfully",
      status: true,
      token,
      data: user,
    });
  } catch (error) {
    console.error("Error in completeRegistration:", error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      firstName,
      middleName,
      lastName,
      userEmail,
      dob,
      gender,
      address,
      phone,
      aadharNumber,
      panNumber,
      firebaseToken,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    const files = req.files;
    const profileImage = files?.profileImage?.[0]?.filename;
    const aadharFrontImage = files?.aadharFrontImage?.[0]?.filename;
    const aadharBackImage = files?.aadharBackImage?.[0]?.filename;
    const panFrontImage = files?.panFrontImage?.[0]?.filename;
    const panBackImage = files?.panBackImage?.[0]?.filename;

    // Update only the fields that are provided
    if (firstName) user.firstName = firstName;
    if (middleName !== undefined) user.middleName = middleName;
    if (lastName) user.lastName = lastName;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (userEmail) user.userEmail = userEmail;
    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (aadharNumber) user.aadharNumber = aadharNumber;
    if (panNumber) user.panNumber = panNumber;
    if (firebaseToken) user.firebaseToken = firebaseToken;

    if (profileImage) user.profileImage = profileImage;
    if (aadharFrontImage) user.aadharFrontImage = aadharFrontImage;
    if (aadharBackImage) user.aadharBackImage = aadharBackImage;
    if (panFrontImage) user.panFrontImage = panFrontImage;
    if (panBackImage) user.panBackImage = panBackImage;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      status: true,
      user,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({
      message: "Server Error",
      status: false,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId).select("-otp -otpExpiresAt"); // Exclude sensitive fields
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    res
      .status(200)
      .json({ message: "User fetched successfully", status: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const addMoneyToWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    let { amount } = req.body;

    // Convert amount to number
    amount = parseFloat(amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount", status: false });
    }

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Ensure wallet is a number
    user.wallet = Number(user.wallet) + amount;
    await user.save();

    // Generate unique transaction ID using crypto
    const transactionId = generateTransactionId();

    // Create a new transaction record
    const transaction = new Transaction({
      userId,
      amount,
      type: "addMoney",
      status: "success",
      transactionId,
      description: `Added ₹${amount} to wallet`,
    });

    await transaction.save();

    // 🛎️ Send notification
    const title = "Wallet Amount Added";
    const body = `₹${amount} has been added to your wallet. Your new balance is ₹${user.wallet}.`;

    try {
      // 💾 Add notification to DB
      await addNotification(userId, title, body);

      // 📲 Send push notification if token exists
      // if (user.firebaseToken) {
      //   await sendNotification(user.firebaseToken, title, body);
      // }
    } catch (notificationError) {
      console.error("Notification Error:", notificationError);
      // Notification fail hone par bhi success response bhej rahe hain
    }

    res.status(200).json({
      message: `₹${amount} added to wallet successfully`,
      status: true,
      walletBalance: user.wallet,
      transaction,
    });
  } catch (error) {
    console.error("Error in addMoneyToWallet:", error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const withdrawFromWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    let { amount } = req.body;

    // Convert amount to number
    amount = parseFloat(amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount", status: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    if (Number(user.wallet) < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance", status: false });
    }

    // Deduct amount
    user.wallet = Number(user.wallet) - amount;
    await user.save();

    const transactionId = generateTransactionId();

    const transaction = new Transaction({
      userId,
      amount,
      type: "withdraw",
      status: "success",
      transactionId,
      description: `Withdrawn ₹${amount} from wallet`,
    });

    await transaction.save();

    const title = "Wallet Withdrawal Successful";
    const body = `₹${amount} has been withdrawn. Remaining balance: ₹${user.wallet}.`;

    try {
      await addNotification(userId, title, body);
      // await sendNotification(user.firebaseToken, title, body); // optional
    } catch (notificationError) {
      console.error("Notification Error:", notificationError);
    }

    return res.status(200).json({
      message: `₹${amount} withdrawn successfully`,
      status: true,
      walletBalance: user.wallet,
      transaction,
    });
  } catch (error) {
    console.error("Error in withdrawFromWallet:", error);
    return res.status(500).json({ message: "Server Error", status: false });
  }
};

export const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    const transactions = await Transaction.find({ userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Wallet details fetched successfully",
      status: true,
      walletBalance: user.wallet || 0,
      transactions,
    });
  } catch (error) {
    console.error("Error in getWalletDetails:", error);
    return res.status(500).json({ message: "Server Error", status: false });
  }
};

export const getPolicyByType = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type) {
      return res
        .status(400)
        .json({ message: "Policy type is required", status: false });
    }

    const policy = await Policy.findOne({ type });
    if (!policy) {
      return res
        .status(404)
        .json({ message: "Policy not found", status: false });
    }

    res
      .status(200)
      .json({ message: "Policy fetched successfully", status: true, policy });
  } catch (error) {
    console.error("Error fetching policy:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getFAQList = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.status(200).json({ faqs, message: "FAQ fetch successfully" });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFAQByFaqId = async (req, res) => {
  try {
    const { id } = req.query;
    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.status(200).json({ faq, message: "FAQ fetch successfully" });
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Transaction history fetched successfully",
      status: true,
      totalTransactions: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.status(500).json({
      message: "Server Error",
      status: false,
    });
  }
};

export const linkBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountHolderName, bankName, accountNumber, ifscCode } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: "All fields are required", status: false });
    }

    // Check if already exists
    const existing = await BankAccount.findOne({ userId });
    if (existing) {
      return res.status(409).json({ message: "Bank account already linked", status: false });
    }

    const bankAccount = new BankAccount({
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
    });

    await bankAccount.save();

    return res.status(201).json({
      message: "Bank account linked successfully",
      status: true,
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error linking bank account:", error);
    return res.status(500).json({ message: "Server error", status: false });
  }
};

export const getBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const bankAccount = await BankAccount.findOne({ userId });

    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found", status: false });
    }

    return res.status(200).json({
      message: "Bank account fetched successfully",
      status: true,
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return res.status(500).json({ message: "Server error", status: false });
  }
};

export const getBankAccountById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Bank account ID is required", status: false });
    }

    const bankAccount = await BankAccount.findById(id);

    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found", status: false });
    }

    return res.status(200).json({
      message: "Bank account fetched successfully",
      status: true,
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error fetching bank account:", error);
    return res.status(500).json({ message: "Server error", status: false });
  }
};

export const updateBankAccount = async (req, res) => {
  try {    
    const { accountHolderName, bankName, accountNumber, ifscCode, id } = req.body;

    if (!id || !accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: "All fields are required", status: false });
    }

    const bankAccount = await BankAccount.findById(id);
    if (!bankAccount) {
      return res.status(404).json({ message: "Bank account not found", status: false });
    }

    bankAccount.accountHolderName = accountHolderName || bankAccount.accountHolderName;
    bankAccount.bankName = bankName || bankAccount.bankName;
    bankAccount.accountNumber = accountNumber || bankAccount.accountNumber;
    bankAccount.ifscCode = ifscCode || bankAccount.ifscCode;

    await bankAccount.save();

    return res.status(200).json({
      message: "Bank account updated successfully",
      status: true,
      data: bankAccount,
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return res.status(500).json({ message: "Server error", status: false });
  }
};

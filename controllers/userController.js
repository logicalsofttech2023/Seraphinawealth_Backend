import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/UserModel.js";
import path from "path";
import crypto from "crypto";
import Transaction from "../models/TransactionModel.js";
import { addNotification } from "../utils/AddNotification.js";
import { Policy, FAQ } from "../models/PolicyModel.js";
import BankAccount, { BankName } from "../models/BankAccount.js";
import Notification from "../models/NotificationModel.js";
import InvestmentPurchase from "../models/InvestmentPurchase.js";
import InvestmentPlan from "../models/InvestmentPlan.js";
import InvestmentCategory from "../models/InvestmentCategory.js";
import ServiceType, { BusinessService, FreeOffering, IndividualBusinessService, InstitutionalService } from "../models/ServiceType.js";
import AgreementContent from "../models/AgreementContent.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import ResearchAnalysis from "../models/ResearchAnalysis.js";
import Contact from "../models/Contact.js";
import Plan from "../models/Plan.js";

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
      return res
        .status(400)
        .json({ message: "Insufficient wallet balance", status: false });
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

    const transactions = await Transaction.find({ userId }).sort({
      createdAt: -1,
    });

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
    const { bankNameId, accountNumber, ifscCode } = req.body;

    if (!bankNameId || !accountNumber || !ifscCode) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    if (!mongoose.Types.ObjectId.isValid(bankNameId)) {
      return res
        .status(400)
        .json({ message: "Invalid bankNameId", status: false });
    }

    // Check if already exists
    const existing = await BankAccount.findOne({ userId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Bank account already linked", status: false });
    }

    const bankAccount = new BankAccount({
      userId,

      bankNameId,
      accountNumber,
      ifscCode,
    });

    await bankAccount.save();

    const populated = await bankAccount.populate("bankNameId", "name icon");

    return res.status(201).json({
      message: "Bank account linked successfully",
      status: true,
      data: populated,
    });
  } catch (error) {
    console.error("Error linking bank account:", error);
    return res.status(500).json({ message: "Server error", status: false });
  }
};

export const getBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const bankAccount = await BankAccount.findOne({ userId }).populate(
      "bankNameId"
    );

    if (!bankAccount) {
      return res
        .status(404)
        .json({ message: "Bank account not found", status: false });
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
      return res
        .status(400)
        .json({ message: "Bank account ID is required", status: false });
    }

    const bankAccount = await BankAccount.findById(id).populate("bankNameId");

    if (!bankAccount) {
      return res
        .status(404)
        .json({ message: "Bank account not found", status: false });
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
    const { id, bankNameId, accountNumber, ifscCode } = req.body;

    // Basic validation
    if (!id || !bankNameId || !accountNumber || !ifscCode) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid account ID", status: false });
    }

    if (!mongoose.Types.ObjectId.isValid(bankNameId)) {
      return res
        .status(400)
        .json({ message: "Invalid bankNameId", status: false });
    }

    const updated = await BankAccount.findByIdAndUpdate(
      id,
      {
        bankNameId,
        accountNumber,
        ifscCode,
      },
      { new: true, runValidators: true }
    ).populate("bankNameId", "name icon");

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Bank account not found", status: false });
    }

    return res.status(200).json({
      message: "Bank account updated successfully",
      status: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return res.status(500).json({ message: "Server error", status: false });
  }
};

export const getAllBankNames = async (req, res) => {
  try {
    const bankNames = await BankName.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ bankNames, message: "Bank names fetched successfully" });
  } catch (error) {
    console.error("Error fetching bank names:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBankNameById = async (req, res) => {
  try {
    const { id } = req.query;
    const bankName = await BankName.findById(id);
    if (!bankName) {
      return res.status(404).json({ message: "Bank name not found" });
    }
    res.status(200).json({ bankName, message: "Bank name fetch successfully" });
  } catch (error) {
    console.error("Error fetching bank name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getNotificationsByUserId = async (req, res) => {
  const userId = req.user.id;
  try {
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    }); // latest first
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const file = req.file || req.files?.profileImage?.[0];
    if (!file) {
      return res
        .status(400)
        .json({ status: false, message: "No profile image uploaded" });
    }

    user.profileImage = file.filename;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const createInvestmentPurchase = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { planId, amount, payoutFrequency } = req.body;

    // Validate plan
    const plan = await InvestmentPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Check minimum amount
    if (amount < plan.minAmount) {
      return res.status(400).json({
        message: `Minimum investment amount is ₹${plan.minAmount}`,
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + plan.durationMonths);

    // Save investment purchase
    const purchase = await InvestmentPurchase.create({
      userId,
      planId,
      amount,
      payoutFrequency,
      startDate,
      endDate,
    });

    // 🧾 Create transaction record
    const transactionId = generateTransactionId();
    const transaction = await Transaction.create({
      userId,
      amount,
      type: "investment",
      status: "success",
      transactionId,
      description: `Invested ₹${amount} in ${plan.title}`,
    });

    // 🛎️ Send notification
    const title = "Investment Successful";
    const body = `You have successfully invested ₹${amount} in ${plan.title}.`;

    try {
      await addNotification(userId, title, body);

      // Optional: Push notification
      // const user = await User.findById(userId);
      // if (user?.firebaseToken) {
      //   await sendNotification(user.firebaseToken, title, body);
      // }
    } catch (notificationError) {
      console.error("Notification Error:", notificationError);
    }

    res.status(201).json({
      message: "Investment successful",
      data: purchase,
      transaction,
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getInvestmentPurchasesInWeb = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { userId };

    const total = await InvestmentPurchase.countDocuments(filter);

    const purchases = await InvestmentPurchase.find(filter)
      .populate("planId")

      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      message: "Investment purchases fetched successfully",
      data: purchases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getInvestmentPurchasesInApp = async (req, res) => {
  try {
    const userId = req.user?.id;

    const filter = { userId };

    const purchases = await InvestmentPurchase.find(filter)
      .populate("planId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Investment purchases fetched successfully",
      data: purchases,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllInvestmentPlansInWeb = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { categoryId, search = "", page = 1, limit = 10 } = req.query;

    const filter = {};

    // Filter by categoryId if provided
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Search by title (case-insensitive)
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await InvestmentPlan.countDocuments(filter);

    // Fetch plans
    const plans = await InvestmentPlan.find(filter)
      .populate("categoryId")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    let updatedPlans = plans;

    if (userId) {
      // Get user's purchased planIds
      const purchased = await InvestmentPurchase.find({ userId }).select(
        "planId"
      );
      const purchasedPlanIds = purchased.map((p) => String(p.planId));

      // Add isPurchased flag to each plan
      updatedPlans = plans.map((plan) => {
        return {
          ...plan.toObject(),
          isPurchased: purchasedPlanIds.includes(String(plan._id)),
        };
      });
    }

    res.status(200).json({
      message: "Investment plans fetched successfully",
      data: updatedPlans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching investment plans",
      error: error.message,
    });
  }
};

export const getAllInvestmentPlansInApp = async (req, res) => {
  try {
    const plans = await InvestmentPlan.find().populate("categoryId");

    res.status(200).json({
      message: "Investment plans fetched successfully",
      data: plans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching investment plans",
      error: error.message,
    });
  }
};

export const getInvestmentPlanById = async (req, res) => {
  try {
    const { id } = req.query;
    const userId = req.user?.id;

    const plan = await InvestmentPlan.findById(id).populate("categoryId");

    if (!plan) {
      return res.status(404).json({ message: "Investment plan not found" });
    }

    let isPurchased = false;

    if (userId) {
      const purchased = await InvestmentPurchase.findOne({
        userId,
        planId: id,
      });

      if (purchased) {
        isPurchased = true;
      }
    }

    res.status(200).json({
      message: "Investment plan fetched successfully",
      data: {
        ...plan.toObject(),
        isPurchased,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching investment plan",
      error: error.message,
    });
  }
};

export const getInvestmentPerformance = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { timeRange = "30days" } = req.query;

    // Get all purchases by user
    const purchases = await InvestmentPurchase.find({ userId }).populate(
      "planId"
    );

    if (!purchases.length) {
      return res.status(200).json({
        message: "No investment data found",
        data: {
          totalInvestment: 0,
          currentValue: 0,
          profitAmount: 0,
          profitPercent: 0,
          graphData: [],
          xAxis: [],
        },
      });
    }

    // Total invested
    const totalInvestment = purchases.reduce(
      (acc, item) => acc + item.amount,
      0
    );

    // Simulate current value (based on ROI and how much time has passed)
    let currentValue = 0;
    const graphData = [];
    const xAxis = [];

    const now = new Date();

    let graphPoints =
      {
        "30days": 30,
        "6months": 6,
        "1year": 12,
      }[timeRange] || 30;

    for (let i = 0; i < graphPoints; i++) {
      let pointValue = 0;
      for (let purchase of purchases) {
        const { amount, startDate, planId } = purchase;
        const duration = planId.durationMonths;
        const roi = planId.roi;

        // Monthly ROI return simulation
        const monthsPassed = Math.min(duration, i + 1);
        const estimatedValue =
          amount + (amount * roi * (monthsPassed / 12)) / 100;
        pointValue += estimatedValue / graphPoints;
      }
      graphData.push(Math.round(pointValue));
      xAxis.push(timeRange === "30days" ? i + 1 : `M${i + 1}`);
    }

    // Simulate current value based on full duration
    for (let purchase of purchases) {
      const { amount, planId, startDate } = purchase;
      const roi = planId.roi;
      const durationMonths = planId.durationMonths;

      const monthsSinceStart =
        (now.getFullYear() - startDate.getFullYear()) * 12 +
        now.getMonth() -
        startDate.getMonth();

      const effectiveMonths = Math.min(monthsSinceStart, durationMonths);
      const estimatedValue =
        amount + (amount * roi * (effectiveMonths / 12)) / 100;
      currentValue += estimatedValue;
    }

    const profitAmount = currentValue - totalInvestment;
    const profitPercent = (profitAmount / totalInvestment) * 100;

    res.status(200).json({
      message: "Investment performance fetched successfully",
      data: {
        totalInvestment: Math.round(totalInvestment),
        currentValue: Math.round(currentValue),
        profitAmount: Math.round(profitAmount),
        profitPercent: parseFloat(profitPercent.toFixed(2)),
        graphData,
        xAxis,
      },
    });
  } catch (error) {
    console.error("Error in investment performance:", error);
    res.status(500).json({
      message: "Failed to fetch investment performance",
      error: error.message,
    });
  }
};

export const getInvestmentPerformanceChart = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { timeRange = "30days" } = req.query;

    // Fetch all purchases with populated plan details
    const purchases = await InvestmentPurchase.find({ userId }).populate(
      "planId"
    );

    if (!purchases.length) {
      return res.status(200).json({
        message: "No investments found",
        data: { xAxis: [], series: [] },
      });
    }

    // Determine number of points
    const pointsCount =
      timeRange === "30days" ? 30 : timeRange === "6months" ? 6 : 12;

    // Helper: get past N month names
    const getPastMonthNames = (count) => {
      const now = new Date();
      return Array.from({ length: count }, (_, i) => {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - (count - i - 1),
          1
        );
        return date.toLocaleString("default", { month: "short" }); // "Jan", "Feb", etc.
      });
    };

    // Build X-axis labels
    const xAxis =
      timeRange === "30days"
        ? Array.from({ length: pointsCount }, (_, i) => `Day ${i + 1}`)
        : getPastMonthNames(pointsCount);

    // Simulate value change per interval
    const series = Array.from({ length: pointsCount }, (_, idx) => {
      let total = 0;
      purchases.forEach((p) => {
        const invested = p.amount;
        const roi = p.planId.roi;
        const elapsedPoints = idx + 1; // days or months
        const factor =
          timeRange === "30days"
            ? elapsedPoints / pointsCount
            : elapsedPoints / 12;
        total += invested + invested * (roi / 100) * factor;
      });
      return parseFloat((total / purchases.length).toFixed(2));
    });

    res.status(200).json({
      message: "Performance data ready",
      data: { xAxis, series },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getPopularPlans = async (req, res) => {
  try {
    const userId = req.user?.id;

    const plans = await InvestmentPlan.find({ isPopular: true })
      .populate("categoryId")
      .sort({ createdAt: -1 });

    let updatedPlans = plans;

    if (userId) {
      const purchased = await InvestmentPurchase.find({ userId }).select(
        "planId"
      );
      const purchasedPlanIds = purchased.map((p) => String(p.planId));

      updatedPlans = plans.map((plan) => ({
        ...plan.toObject(),
        isPurchased: purchasedPlanIds.includes(String(plan._id)),
      }));
    }

    res.status(200).json({
      message: "Popular investment plans fetched",
      data: updatedPlans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching popular plans",
      error: error.message,
    });
  }
};

export const getFeaturedPlans = async (req, res) => {
  try {
    const userId = req.user?.id;

    const plans = await InvestmentPlan.find({ isFeatured: true })
      .populate("categoryId")
      .sort({ createdAt: -1 });

    let updatedPlans = plans;

    if (userId) {
      const purchased = await InvestmentPurchase.find({ userId }).select(
        "planId"
      );
      const purchasedPlanIds = purchased.map((p) => String(p.planId));

      updatedPlans = plans.map((plan) => ({
        ...plan.toObject(),
        isPurchased: purchasedPlanIds.includes(String(plan._id)),
      }));
    }

    res.status(200).json({
      message: "Featured investment plans fetched",
      data: updatedPlans,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching featured plans",
      error: error.message,
    });
  }
};

export const getAllCategory = async (req, res) => {
  try {
    const categories = await InvestmentCategory.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Categories fetched", data: categories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

export const getServiceTypes = async (req, res) => {
  try {
    const services = await ServiceType.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ message: "Fetched all service types", data: services });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching services", error: err.message });
  }
};

export const getAgreementContent = async (req, res) => {
  try {
    const content = await AgreementContent.findOne();

    res.status(200).json({
      status: true,
      message: "Agreement content fetched successfully",
      data: content,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server error", error });
  }
};

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // check if already subscribed
    const alreadySubscribed = await NewsletterSubscriber.findOne({ email });

    const subscriber = await User.findOne({ userEmail: email });

    if (subscriber) {
      return res
        .status(409)
        .json({ success: false, message: "Already subscribed" });
    }
    if (alreadySubscribed) {
      return res
        .status(409)
        .json({ success: false, message: "Already subscribed" });
    }

    const newSubscriber = new NewsletterSubscriber({ email });
    await newSubscriber.save();

    res.status(200).json({ success: true, message: "Subscribed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong", error });
  }
};

export const getAllResearchAnalysis = async (req, res) => {
  try {
    const data = await ResearchAnalysis.findOne().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, message: "Fetched successfully", data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch research analysis",
    });
  }
};

export const createContact = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, message } = req.body;

    if (!firstName || !lastName || !phone || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newContact = new Contact({ firstName, lastName, phone, email, message });
    await newContact.save();

    res.status(200).json({ success: true, message: "Message submitted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

export const getAllFreeOfferingsInUser = async (req, res) => {
  try {
    const offerings = await FreeOffering.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Fetched free offerings successfully",
      data: offerings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching free offerings",
      error: err.message,
    });
  }
};

export const getAllIndividualBusinessServicesInUser = async (req, res) => {
  try {
    const data = await IndividualBusinessService.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Fetched Data successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching Data",
      error: err.message,
    });
  }
};

export const getAllBusinessServicesInUser = async (req, res) => {
  try {
    const data = await BusinessService.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Fetched Data successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching Data",
      error: err.message,
    });
  }
};

export const getAllInstitutionalServicesInUser = async (req, res) => {
  try {
    const data = await InstitutionalService.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Fetched Data successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching Data",
      error: err.message,
    });
  }
};

export const getAllFAQsInUser = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.status(200).json({ faqs, message: "FAQ fetch successfully" });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPlan = async (req, res) => {
  const userId = req.user.id;
  try {
    const {
      deliveryPreference,
      serviceChoice,
      startDate,
      endDate,
      freeOfferings = [],
      individualBusinessServices = [],
      businessServices = [],
      institutionalServices = [],
      totalPrice = 0,
    } = req.body;

    // Basic validation
    if (!deliveryPreference || !serviceChoice || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    // Create plan
    const newPlan = new Plan({
      deliveryPreference,
      serviceChoice,
      startDate,
      endDate,
      freeOfferings,
      individualBusinessServices,
      businessServices,
      institutionalServices,
      totalPrice,
      userId,
    });

    const savedPlan = await newPlan.save();

    res.status(200).json({
      success: true,
      message: "Plan created successfully.",
      plan: savedPlan,
    });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating plan.",
    });
  }
};

export const renewPlan = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Validate userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID is missing.",
      });
    }

    // Validate totalPrice if provided
    const { totalPrice } = req.body;
    if (totalPrice !== undefined && (typeof totalPrice !== "number" || totalPrice < 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid totalPrice. It must be a positive number.",
      });
    }

    // Check if the user already has a plan
    const existingPlan = await Plan.findOne({ userId });
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "No existing plan found for this user to renew.",
      });
    }

    // Extend the current end date by 6 months
    const extendedEndDate = new Date(existingPlan.endDate);
    extendedEndDate.setMonth(extendedEndDate.getMonth() + 6);

    existingPlan.endDate = extendedEndDate;

    // Update totalPrice if provided
    if (totalPrice !== undefined) {
      existingPlan.totalPrice = totalPrice;
    }

    const updatedPlan = await existingPlan.save();

    return res.status(200).json({
      success: true,
      message: "Plan renewed successfully.",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Error renewing plan:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while renewing the plan.",
    });
  }
};


export const getPlanByUserId = async (req, res) => {
  try {
    const userId  = req.user.id;

    const plan = await Plan.findOne({ userId })
      .populate("freeOfferings")
      .populate("individualBusinessServices")
      .populate("businessServices")
      .populate("institutionalServices");

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "No plan found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan fetched successfully.",
      plan,
    });
  } catch (error) {
    console.error("Error fetching plan by userId:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching plan.",
    });
  }
};

export const hasUserTakenPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const existingPlan = await Plan.findOne({ userId });

    if (existingPlan) {
      return res.status(200).json({
        success: true,
        hasPlan: true,
        plan: existingPlan,
        message: "User has already taken a plan.",
      });
    } else {
      return res.status(200).json({
        success: true,
        hasPlan: false,
        message: "User has not taken any plan.",
      });
    }
  } catch (error) {
    console.error("Error checking user plan:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking plan status.",
    });
  }
};

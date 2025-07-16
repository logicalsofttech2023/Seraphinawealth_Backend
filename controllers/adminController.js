import { Policy, FAQ } from "../models/PolicyModel.js";
import Admin from "../models/AdminModel.js";
import jwt from "jsonwebtoken";
import Membership from "../models/MembershipModel.js";
import { BankName } from "../models/BankAccount.js";
import InvestmentCategory from "../models/InvestmentCategory.js";
import InvestmentPlan from "../models/InvestmentPlan.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import InvestmentPurchase from "../models/InvestmentPurchase.js";
import User from "../models/UserModel.js";
import ServiceType, {
  BusinessService,
  FreeOffering,
  IndividualBusinessService,
  InstitutionalService,
} from "../models/ServiceType.js";
import AgreementContent from "../models/AgreementContent.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";
import ResearchAnalysis from "../models/ResearchAnalysis.js";
import fs from "fs";
import path from "path";
import Contact from "../models/Contact.js";
import Plan from "../models/Plan.js";
import Testimonial from "../models/Testimonial.js";
import UserGraph from "../models/UserGraph.js";
import moment from "moment";
import Transaction from "../models/TransactionModel.js";
import PlanAmountModel from "../models/PlanAmountModel.js";
import {
  Banner,
  ContactUs,
  HowItWorks,
  Newsletter,
  OurObjectives,
  WhyChooseUs,
} from "../models/WebsiteUi.js";

const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|txt)$/i;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const generateJwtToken = (user) => {
  return jwt.sign(
    { id: user._id, phone: user.phone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const adminSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = await Admin.create({ name, email, password: hashedPassword });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email },
      token: generateJwtToken(admin),
    });
  } catch (error) {
    console.error("Admin Signup Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Admin logged in successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email },
      token: generateJwtToken(admin),
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAdminDetail = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Await the query to resolve
    const admin = await Admin.findById(adminId).select("-otp -otpExpiresAt");

    if (!admin) {
      return res.status(400).json({ message: "User not found", status: false });
    }

    res.status(200).json({
      message: "Admin data fetched successfully",
      status: true,
      data: admin,
    });
  } catch (error) {
    console.error("Error fetching admin details:", error);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { newPassword, confirmPassword } = req.body;

    if (!adminId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Admin ID, new password, and confirm password are required",
        status: false,
      });
    }

    // Find admin by ID
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found", status: false });
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Passwords do not match", status: false });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password",
        status: false,
      });
    }

    // Hash the new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res
      .status(200)
      .json({ message: "Password reset successful", status: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

export const updateAdminDetail = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        message: "name, and email are required",
        status: false,
      });
    }

    // Find and update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email },
      { new: true, select: "-password -otp -otpExpiresAt" }
    );

    if (!updatedAdmin) {
      return res
        .status(400)
        .json({ message: "Admin not found", status: false });
    }

    res.status(200).json({
      message: "Admin details updated successfully",
      status: true,
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin details:", error);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let searchFilter = { role: "user", firstName: { $exists: true, $ne: "" } };
    if (search) {
      searchFilter = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { userEmail: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (status !== undefined) {
      searchFilter.status = status === "true";
    }

    const users = await User.find(searchFilter)
      .select("-otp -otpExpiresAt")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(searchFilter);

    res.status(200).json({
      message: "Users fetched successfully",
      status: true,
      data: users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getUsersWithInvestment = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Step 1: Get unique userIds who have made an investment
    const investmentUserIds = await InvestmentPurchase.distinct("userId");

    // Step 2: Build search filter
    let searchFilter = {
      _id: { $in: investmentUserIds },
      role: "user",
      firstName: { $exists: true, $ne: "" },
    };

    if (search) {
      searchFilter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (status !== undefined) {
      searchFilter.status = status === "true";
    }

    // Step 3: Query users
    const users = await User.find(searchFilter)
      .select("-otp -otpExpiresAt -password")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(searchFilter);

    res.status(200).json({
      message: "Users with investment fetched successfully",
      status: true,
      data: users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching users with investment:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const policyUpdate = async (req, res) => {
  try {
    const { type, content } = req.body;
    const image = req.files?.image?.[0]?.filename || "";

    if (!type || !content) {
      return res
        .status(400)
        .json({ message: "Type and content are required", status: false });
    }

    let policy = await Policy.findOne({ type });

    if (policy) {
      policy.content = content;
      if (image) {
        policy.image = image; // update image only if new one is uploaded
      }
      await policy.save();
      return res.status(200).json({
        message: "Policy updated successfully",
        status: true,
        policy,
      });
    } else {
      policy = new Policy({
        type,
        content,
        ...(image && { image }), // set image only if exists
      });
      await policy.save();
      return res.status(200).json({
        message: "Policy created successfully",
        status: true,
        policy,
      });
    }
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const getPolicy = async (req, res) => {
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

export const addUpdateMembership = async (req, res) => {
  try {
    const { membershipId, planType, price, status } = req.body;

    if (!price || (!membershipId && !planType)) {
      return res
        .status(400)
        .json({ message: "Missing required fields", status: false });
    }

    let membership;

    if (membershipId) {
      // Update existing membership
      membership = await Membership.findById(membershipId);

      if (!membership) {
        return res
          .status(404)
          .json({ message: "Membership not found", status: false });
      }

      membership.price = price;
      membership.status = status ?? membership.status;
      await membership.save();
      return res
        .status(200)
        .json({ message: "Membership updated", membership, status: true });
    } else {
      // Add new membership
      membership = new Membership({ planType, price, status });
      await membership.save();
      return res
        .status(201)
        .json({ message: "Membership created", membership, status: true });
    }
  } catch (error) {
    console.error("Error in addUpdateMembership:", error);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const getAllMembership = async (req, res) => {
  try {
    const membership = await Membership.find();
    if (!membership) {
      return res
        .status(404)
        .json({ message: "Membership not found", status: false });
    }
    res.status(200).json({
      message: "Membership fetched successfully",
      status: true,
      membership,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message,
    });
  }
};

export const addFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ message: "Question and answer are required." });
    }

    const newFAQ = new FAQ({
      question,
      answer,
    });

    await newFAQ.save();

    res.status(200).json({ message: "FAQ added successfully", faq: newFAQ });
  } catch (error) {
    console.error("Error adding FAQ:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const { question, answer, isActive, id } = req.body;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      { question, answer, isActive },
      { new: true, runValidators: true }
    );

    if (!updatedFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res
      .status(200)
      .json({ message: "FAQ updated successfully", faq: updatedFAQ });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.status(200).json({ faqs, message: "FAQ fetch successfully" });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFAQById = async (req, res) => {
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

export const CreateBankName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    const icon = req.files?.icon?.[0]?.filename || "";

    if (!icon) {
      return res.status(400).json({ message: "Icon is required." });
    }

    const newBankName = new BankName({
      name,
      icon,
    });

    await newBankName.save();

    res
      .status(200)
      .json({ message: "Bank name added successfully", bankName: newBankName });
  } catch (error) {
    console.error("Error adding bank name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllBankNamesInAdmin = async (req, res) => {
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

export const updateBankName = async (req, res) => {
  try {
    const { name, isActive, id } = req.body;

    // Get uploaded icon file name, if exists
    const icon = req.files?.icon?.[0]?.filename;

    // Build the update object dynamically
    const updateData = {
      ...(name && { name }),
      ...(typeof isActive !== "undefined" && { isActive }),
      ...(icon && { icon }), // update icon only if new file uploaded
    };

    const updatedBankName = await BankName.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBankName) {
      return res.status(404).json({ message: "Bank name not found" });
    }

    res.status(200).json({
      message: "Bank name updated successfully",
      bankName: updatedBankName,
    });
  } catch (error) {
    console.error("Error updating bank name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBankName = async (req, res) => {
  try {
    const { id } = req.body;

    const deletedBankName = await BankName.findByIdAndDelete(id);

    if (!deletedBankName) {
      return res.status(404).json({ message: "Bank name not found" });
    }

    res.status(200).json({ message: "Bank name deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBankNameByIdInAdmin = async (req, res) => {
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

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const iconFile = req.file || req.files?.icon?.[0];

    const existing = await InvestmentCategory.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const icon = iconFile?.filename || null;

    const newCategory = new InvestmentCategory({ name, description, icon });
    await newCategory.save();

    res.status(201).json({ message: "Category created", data: newCategory });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.query;
    const { name, description } = req.body;
    const iconFile = req.file || req.files?.icon?.[0];

    const updates = {
      ...(name && { name }),
      ...(description && { description }),
      ...(iconFile?.filename && { icon: iconFile.filename }),
    };

    const updated = await InvestmentCategory.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated", data: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating category", error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
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

export const getCategoryById = async (req, res) => {
  const { id } = req.query;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const category = await InvestmentCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ message: "Category fetched", data: category });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching category",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.query;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid category ID" });
  }

  try {
    const deleted = await InvestmentCategory.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category deleted successfully",
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};

export const addInvestmentPlan = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      minAmount,
      durationMonths,
      roi,
      risk,
      additionalInfo,
      description,
      status,
    } = req.body;

    // Validate required fields
    if (!categoryId || !title || !minAmount || !durationMonths || !roi) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newPlan = new InvestmentPlan({
      categoryId,
      title,
      minAmount,
      durationMonths,
      roi,
      risk, // optional: defaults to "Moderate"
      additionalInfo,
      description,
      status, // optional: defaults to "active"
    });

    await newPlan.save();

    res.status(201).json({
      message: "Investment Plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating investment plan",
      error: error.message,
    });
  }
};

export const updateInvestmentPlan = async (req, res) => {
  try {
    const { id } = req.query;

    const {
      categoryId,
      title,
      minAmount,
      durationMonths,
      roi,
      risk,
      additionalInfo,
      description,
      status,
    } = req.body;

    const updates = {
      ...(categoryId && { categoryId }),
      ...(title && { title }),
      ...(minAmount && { minAmount }),
      ...(durationMonths && { durationMonths }),
      ...(roi && { roi }),
      ...(risk && { risk }),
      ...(additionalInfo && { additionalInfo }),
      ...(description && { description }),
      ...(status && { status }),
    };

    const updatedPlan = await InvestmentPlan.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedPlan) {
      return res.status(404).json({ message: "Investment Plan not found" });
    }

    res.json({
      message: "Investment Plan updated successfully",
      data: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating investment plan",
      error: error.message,
    });
  }
};

export const getAllPlans = async (req, res) => {
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

export const getPlanById = async (req, res) => {
  try {
    const { id } = req.query;

    const plan = await InvestmentPlan.findById(id).populate("categoryId");
    if (!plan) {
      return res.status(404).json({ message: "Investment plan not found" });
    }

    res.status(200).json({
      message: "Investment plan fetched successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching investment plan",
      error: error.message,
    });
  }
};

export const updatePlanFlags = async (req, res) => {
  try {
    const { isPopular, isFeatured, planId } = req.body;

    const updateData = {};
    if (typeof isPopular === "boolean") updateData.isPopular = isPopular;
    if (typeof isFeatured === "boolean") updateData.isFeatured = isFeatured;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const updated = await InvestmentPlan.findByIdAndUpdate(planId, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Investment Plan not found" });
    }

    res.status(200).json({
      message: "Plan updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addServiceType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const exists = await ServiceType.findOne({ name });
    if (exists)
      return res.status(409).json({ message: "Service already exists" });

    const newService = await ServiceType.create({ name });
    res.status(200).json({ message: "Service type added", data: newService });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding service", error: err.message });
  }
};

export const getAllServiceTypes = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      name: { $regex: search, $options: "i" }, // assuming 'name' is the searchable field
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      ServiceType.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceType.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched service types successfully",
      data: services,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching services",
      error: err.message,
    });
  }
};

export const getServiceTypesInAdmin = async (req, res) => {
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

export const getServiceTypeById = async (req, res) => {
  try {
    const { id } = req.query;
    const service = await ServiceType.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Fetched service type", data: service });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching service", error: err.message });
  }
};

export const updateServiceType = async (req, res) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const updated = await ServiceType.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service type updated", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating service", error: err.message });
  }
};

export const deleteServiceType = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await ServiceType.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service type deleted", data: deleted });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting service", error: err.message });
  }
};

// Free Offering Controllers
export const addFreeOffering = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const exists = await FreeOffering.findOne({ name });
    if (exists)
      return res.status(409).json({ message: "Free offering already exists" });

    const newOffering = await FreeOffering.create({ name });
    res.status(200).json({ message: "Free offering added", data: newOffering });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding free offering", error: err.message });
  }
};

export const getAllFreeOfferings = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      name: { $regex: search, $options: "i" },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [offerings, total] = await Promise.all([
      FreeOffering.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FreeOffering.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched free offerings successfully",
      data: offerings,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching free offerings",
      error: err.message,
    });
  }
};

export const getFreeOfferingById = async (req, res) => {
  try {
    const { id } = req.query;
    const offering = await FreeOffering.findById(id);
    if (!offering)
      return res.status(404).json({ message: "Free offering not found" });

    res.status(200).json({ message: "Fetched free offering", data: offering });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching free offering", error: err.message });
  }
};

export const updateFreeOffering = async (req, res) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const updated = await FreeOffering.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Free offering not found" });

    res.status(200).json({ message: "Free offering updated", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating free offering", error: err.message });
  }
};

export const deleteFreeOffering = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await FreeOffering.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Free offering not found" });

    res.status(200).json({ message: "Free offering deleted", data: deleted });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting free offering", error: err.message });
  }
};

export const getAllFreeOfferingsInAdmin = async (req, res) => {
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

// Individual Business Service Controllers
export const addIndividualBusinessService = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const exists = await IndividualBusinessService.findOne({ name });
    if (exists)
      return res
        .status(409)
        .json({ message: "Individual business service already exists" });

    const newService = await IndividualBusinessService.create({ name });
    res
      .status(200)
      .json({ message: "Individual business service added", data: newService });
  } catch (err) {
    res.status(500).json({
      message: "Error adding individual business service",
      error: err.message,
    });
  }
};

export const getAllIndividualBusinessServices = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      name: { $regex: search, $options: "i" },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      IndividualBusinessService.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      IndividualBusinessService.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched individual business services successfully",
      data: services,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching individual business services",
      error: err.message,
    });
  }
};

export const getIndividualBusinessServiceById = async (req, res) => {
  try {
    const { id } = req.query;
    const service = await IndividualBusinessService.findById(id);
    if (!service)
      return res
        .status(404)
        .json({ message: "Individual business service not found" });

    res
      .status(200)
      .json({ message: "Fetched individual business service", data: service });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching individual business service",
      error: err.message,
    });
  }
};

export const updateIndividualBusinessService = async (req, res) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const updated = await IndividualBusinessService.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ message: "Individual business service not found" });

    res
      .status(200)
      .json({ message: "Individual business service updated", data: updated });
  } catch (err) {
    res.status(500).json({
      message: "Error updating individual business service",
      error: err.message,
    });
  }
};

export const deleteIndividualBusinessService = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await IndividualBusinessService.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Individual business service not found" });

    res
      .status(200)
      .json({ message: "Individual business service deleted", data: deleted });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting individual business service",
      error: err.message,
    });
  }
};

export const getAllIndividualBusinessServicesInAdmin = async (req, res) => {
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

// Business Service Controllers
export const addBusinessService = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const exists = await BusinessService.findOne({ name });
    if (exists)
      return res
        .status(409)
        .json({ message: "Business service already exists" });

    const newService = await BusinessService.create({ name });
    res
      .status(200)
      .json({ message: "Business service added", data: newService });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding business service", error: err.message });
  }
};

export const getAllBusinessServices = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      name: { $regex: search, $options: "i" },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      BusinessService.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BusinessService.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched business services successfully",
      data: services,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching business services",
      error: err.message,
    });
  }
};

export const getBusinessServiceById = async (req, res) => {
  try {
    const { id } = req.query;
    const service = await BusinessService.findById(id);
    if (!service)
      return res.status(404).json({ message: "Business service not found" });

    res
      .status(200)
      .json({ message: "Fetched business service", data: service });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching business service", error: err.message });
  }
};

export const updateBusinessService = async (req, res) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const updated = await BusinessService.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Business service not found" });

    res
      .status(200)
      .json({ message: "Business service updated", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating business service", error: err.message });
  }
};

export const deleteBusinessService = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await BusinessService.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Business service not found" });

    res
      .status(200)
      .json({ message: "Business service deleted", data: deleted });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting business service", error: err.message });
  }
};

export const getAllBusinessServicesInAdmin = async (req, res) => {
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

// Institutional Service Controllers
export const addInstitutionalService = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const exists = await InstitutionalService.findOne({ name });
    if (exists)
      return res
        .status(409)
        .json({ message: "Institutional service already exists" });

    const newService = await InstitutionalService.create({ name });
    res
      .status(200)
      .json({ message: "Institutional service added", data: newService });
  } catch (err) {
    res.status(500).json({
      message: "Error adding institutional service",
      error: err.message,
    });
  }
};

export const getAllInstitutionalServices = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      name: { $regex: search, $options: "i" },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      InstitutionalService.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      InstitutionalService.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched institutional services successfully",
      data: services,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching institutional services",
      error: err.message,
    });
  }
};

export const getInstitutionalServiceById = async (req, res) => {
  try {
    const { id } = req.query;
    const service = await InstitutionalService.findById(id);
    if (!service)
      return res
        .status(404)
        .json({ message: "Institutional service not found" });

    res
      .status(200)
      .json({ message: "Fetched institutional service", data: service });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching institutional service",
      error: err.message,
    });
  }
};

export const updateInstitutionalService = async (req, res) => {
  try {
    const { id } = req.query;
    const { name } = req.body;

    const updated = await InstitutionalService.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ message: "Institutional service not found" });

    res
      .status(200)
      .json({ message: "Institutional service updated", data: updated });
  } catch (err) {
    res.status(500).json({
      message: "Error updating institutional service",
      error: err.message,
    });
  }
};

export const deleteInstitutionalService = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await InstitutionalService.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ message: "Institutional service not found" });

    res
      .status(200)
      .json({ message: "Institutional service deleted", data: deleted });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting institutional service",
      error: err.message,
    });
  }
};

export const getAllInstitutionalServicesInAdmin = async (req, res) => {
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

export const updateAgreementContent = async (req, res) => {
  try {
    const { content, amount } = req.body;

    if (!content || !amount) {
      return res
        .status(400)
        .json({ status: false, message: "Content and amount are required" });
    }

    const existing = await AgreementContent.findOne();

    if (existing) {
      existing.content = content;
      existing.amount = amount;
      await existing.save();
    } else {
      await AgreementContent.create({ content, amount });
    }

    res
      .status(200)
      .json({ status: true, message: "Agreement content saved successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server error", error });
  }
};

export const getAgreementContentInAdmin = async (req, res) => {
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

export const getAllSubscribers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      email: { $regex: search, $options: "i" }, // assuming search is on the email field
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscribers, total] = await Promise.all([
      NewsletterSubscriber.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      NewsletterSubscriber.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched subscribers successfully",
      subscribers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
      error: error.message,
    });
  }
};

export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.query;
    await NewsletterSubscriber.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Subscriber removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Deletion failed", error });
  }
};

export const addResearchAnalysis = async (req, res) => {
  try {
    const files = req.files?.documents || [];
    const {
      title = "",
      description = "",
      serviceChoice,
      freeOfferings = "[]",
      individualBusinessServices = "[]",
      businessServices = "[]",
      institutionalServices = "[]",
    } = req.body;

    // Validation
    if (!files.length || !title || !description || !serviceChoice) {
      return res.status(400).json({
        success: false,
        message: "Files, title, description, and serviceChoice are required.",
      });
    }

    // Safe parsing function
    const parseArray = (input) => {
      try {
        return typeof input === "string" ? JSON.parse(input) : input;
      } catch {
        return [];
      }
    };

    const parsedFreeOfferings = parseArray(freeOfferings);
    const parsedIndividualBusinessServices = parseArray(
      individualBusinessServices
    );
    const parsedBusinessServices = parseArray(businessServices);
    const parsedInstitutionalServices = parseArray(institutionalServices);

    const fileNames = [];

    for (const file of files) {
      if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type for file ${file.originalname}`,
        });
      }

      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds the 20MB limit.`,
        });
      }

      fileNames.push(file.filename);
    }

    const doc = new ResearchAnalysis({
      title: title.trim(),
      description: description.trim(),
      documents: fileNames,
      serviceChoice,
      freeOfferings: parsedFreeOfferings,
      individualBusinessServices: parsedIndividualBusinessServices,
      businessServices: parsedBusinessServices,
      institutionalServices: parsedInstitutionalServices,
    });

    await doc.save();

    return res.status(201).json({
      success: true,
      message: "Research document uploaded successfully.",
      data: doc,
    });
  } catch (error) {
    console.error("Error in addResearchAnalysis:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// const notifyUsersByService = async ({
//   serviceField,
//   serviceChoiceType,
//   serviceIds,
//   fileNames,
//   title,
//   description,
// }) => {
//   if (!serviceIds.length) return;

//   try {
//     const matchingPlans = await Plan.find({
//       serviceChoice: serviceChoiceType,
//       [serviceField]: { $in: serviceIds },
//     }).select("userId");

//     const userIds = matchingPlans.map((plan) => plan.userId);

//     const users = await User.find({ _id: { $in: userIds } }).select(
//       "userEmail"
//     );
//     const planEmailList = users.map((user) => user.userEmail).filter(Boolean);

//     // For freeOffering only: include subscribed newsletter users
//     let newsletterEmailList = [];
//     if (serviceField === "freeOfferings") {
//       const subscribers = await NewsletterSubscriber.find({
//         status: "Subscribed",
//       }).select("email");
//       newsletterEmailList = subscribers.map((s) => s.email).filter(Boolean);
//     }

//     // Merge and deduplicate email list
//     const allRecipients = [
//       ...new Set([...planEmailList, ...newsletterEmailList]),
//     ];

//     const baseUrl = `${process.env.BASE_URL}/uploads/documents`;
//     const fileLinks = fileNames
//       .map((name) => `${baseUrl}/${name}`)
//       .join("<br>");

//     const subject = `New Research Document: ${title}`;
//     const html = `
//       <h3>${title}</h3>
//       ${description}
//       <p><strong>Documents:</strong><br>${fileLinks}</p>
//     `;

//     for (const email of allRecipients) {
//       await sendMail({ to: email, subject, html });
//     }

//     console.log(
//       `Mail sent to ${allRecipients.length} users for ${serviceField}`
//     );
//   } catch (err) {
//     console.error(`Error sending email for ${serviceField}:`, err);
//   }
// };

// export const addResearchAnalysis = async (req, res) => {
//   try {
//     const files = req.files?.documents || [];
//     const {
//       title = "",
//       description = "",
//       serviceChoice,
//       freeOfferings = "[]",
//       individualBusinessServices = "[]",
//       businessServices = "[]",
//       institutionalServices = "[]",
//     } = req.body;

//     // Validation
//     if (!files.length || !title || !description || !serviceChoice) {
//       return res.status(400).json({
//         success: false,
//         message: "Files, title, description, and serviceChoice are required.",
//       });
//     }

//     // Safe parsing function
//     const parseArray = (input) => {
//       try {
//         return typeof input === "string" ? JSON.parse(input) : input;
//       } catch {
//         return [];
//       }
//     };

//     const parsedFreeOfferings = parseArray(freeOfferings);
//     const parsedIndividualBusinessServices = parseArray(
//       individualBusinessServices
//     );
//     const parsedBusinessServices = parseArray(businessServices);
//     const parsedInstitutionalServices = parseArray(institutionalServices);

//     const fileNames = [];

//     for (const file of files) {
//       if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid file type for file ${file.originalname}`,
//         });
//       }

//       if (file.size > MAX_FILE_SIZE) {
//         return res.status(400).json({
//           success: false,
//           message: `File ${file.originalname} exceeds the 20MB limit.`,
//         });
//       }

//       fileNames.push(file.filename);
//     }

//     const doc = new ResearchAnalysis({
//       title: title.trim(),
//       description: description.trim(),
//       documents: fileNames,
//       serviceChoice,
//       freeOfferings: parsedFreeOfferings,
//       individualBusinessServices: parsedIndividualBusinessServices,
//       businessServices: parsedBusinessServices,
//       institutionalServices: parsedInstitutionalServices,
//     });

//     await doc.save();

//     // 🚀 Notify in background (non-blocking)
//     setImmediate(async () => {
//       try {
//         await Promise.allSettled([
//           notifyUsersByService({
//             serviceField: "freeOfferings",
//             serviceChoiceType: "free",
//             serviceIds: parsedFreeOfferings,
//             fileNames,
//             title,
//             description,
//           }),
//           notifyUsersByService({
//             serviceField: "individualBusinessServices",
//             serviceChoiceType: "individual",
//             serviceIds: parsedIndividualBusinessServices,
//             fileNames,
//             title,
//             description,
//           }),
//           notifyUsersByService({
//             serviceField: "businessServices",
//             serviceChoiceType: "business",
//             serviceIds: parsedBusinessServices,
//             fileNames,
//             title,
//             description,
//           }),
//           notifyUsersByService({
//             serviceField: "institutionalServices",
//             serviceChoiceType: "institutional",
//             serviceIds: parsedInstitutionalServices,
//             fileNames,
//             title,
//             description,
//           }),
//         ]);
//       } catch (notifyErr) {
//         console.error("Notification background error:", notifyErr);
//       }
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Research document uploaded successfully.",
//       data: doc,
//     });
//   } catch (error) {
//     console.error("Error in addResearchAnalysis:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

const notifyUsersByService = async ({
  serviceField,
  serviceChoiceType,
  serviceIds,
  fileNames,
  title,
  description,
}) => {
  if (!serviceIds.length) return;

  try {
    // Get all ACTIVE plans where users have any of the selected services
    const matchingPlans = await Plan.find({
      status: "active", // Only active plans
      [serviceField]: { $in: serviceIds },
    }).select("userId");

    // Extract unique userIds
    const userIdSet = new Set(
      matchingPlans.map((plan) => plan.userId.toString())
    );

    const users = await User.find({
      _id: { $in: Array.from(userIdSet) },
    }).select("userEmail");

    const planEmailList = users.map((user) => user.userEmail).filter(Boolean);

    // Include newsletter subscribers for free offerings only
    let newsletterEmailList = [];
    if (serviceField === "freeOfferings") {
      const subscribers = await NewsletterSubscriber.find({
        status: "Subscribed",
      }).select("email");
      newsletterEmailList = subscribers.map((s) => s.email).filter(Boolean);
    }

    // Merge and deduplicate emails
    const allRecipients = [
      ...new Set([...planEmailList, ...newsletterEmailList]),
    ];

    const baseUrl = `${process.env.BASE_URL}/uploads/documents`;
    const fileLinks = fileNames
      .map((name) => `${baseUrl}/${name}`)
      .join("<br>");

    const subject = `New Research Document: ${title}`;
    const html = `
      <h3>${title}</h3>
      <p>${description}</p>
      <p><strong>Documents:</strong><br>${fileLinks}</p>
    `;

    for (const email of allRecipients) {
      await sendMail({ to: email, subject, html });
    }

    console.log(
      `📩 Mail sent to ${allRecipients.length} users for ${serviceField}`
    );
  } catch (err) {
    console.error(`❌ Error sending email for ${serviceField}:`, err);
  }
};

export const updateResearchAnalysis = async (req, res) => {
  try {
    const {
      id,
      title = "",
      description = "",
      serviceChoice,
      freeOfferings = "[]",
      individualBusinessServices = "[]",
      businessServices = "[]",
      institutionalServices = "[]",
    } = req.body;

    const files = req.files?.documents || [];

    if (!id || !title.trim() || !description.trim() || !serviceChoice) {
      return res.status(400).json({
        success: false,
        message: "ID, title, description, and serviceChoice are required.",
      });
    }

    const existingDoc = await ResearchAnalysis.findById(id);
    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: "Research document not found.",
      });
    }

    // Safe parsing function
    const parseArray = (input) => {
      try {
        return typeof input === "string" ? JSON.parse(input) : input;
      } catch {
        return [];
      }
    };

    const parsedFreeOfferings = parseArray(freeOfferings);
    const parsedIndividualBusinessServices = parseArray(
      individualBusinessServices
    );
    const parsedBusinessServices = parseArray(businessServices);
    const parsedInstitutionalServices = parseArray(institutionalServices);

    const newFileNames = [];
    for (const file of files) {
      if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type for file ${file.originalname}`,
        });
      }

      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds the 20MB limit.`,
        });
      }

      newFileNames.push(file.filename);
    }

    // Update fields
    existingDoc.title = title.trim();
    existingDoc.description = description.trim();
    existingDoc.serviceChoice = serviceChoice;
    existingDoc.freeOfferings = parsedFreeOfferings;
    existingDoc.individualBusinessServices = parsedIndividualBusinessServices;
    existingDoc.businessServices = parsedBusinessServices;
    existingDoc.institutionalServices = parsedInstitutionalServices;

    if (newFileNames.length) {
      existingDoc.documents.push(...newFileNames);
    }

    await existingDoc.save();

    return res.status(200).json({
      success: true,
      message: "Research document updated successfully.",
      data: existingDoc,
    });
  } catch (error) {
    console.error("Error in updateResearchAnalysis:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteResearchDocument = async (req, res) => {
  try {
    const { filename, documentId } = req.body;

    if (!filename || !documentId) {
      return res.status(400).json({
        success: false,
        message: "Filename and document ID are required.",
      });
    }

    const filePath = path.join("uploads", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server.",
      });
    }

    // Delete the file from filesystem
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete the file.",
        });
      }

      // Remove the filename from the document in DB
      const updatedDoc = await ResearchAnalysis.findByIdAndUpdate(
        documentId,
        { $pull: { documents: filename } },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({
          success: false,
          message: "Document not found in database.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "File deleted from server and database successfully.",
        data: updatedDoc,
      });
    });
  } catch (error) {
    console.error("Error in deleteResearchDocument:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllResearchAnalysisInAdmin = async (req, res) => {
  try {
    const data = await ResearchAnalysis.find().sort({ createdAt: -1 });
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

export const getFreeOfferingResearch = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      freeOfferings: { $exists: true, $ne: [] },
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    // Add date filter if both startDate and endDate are provided
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await ResearchAnalysis.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ResearchAnalysis.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.error("Error fetching Free Offering research:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getIndividualBusinessResearch = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      individualBusinessServices: { $exists: true, $ne: [] },
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await ResearchAnalysis.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ResearchAnalysis.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.error("Error fetching Individual Business research:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getBusinessServicesResearch = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      businessServices: { $exists: true, $ne: [] },
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await ResearchAnalysis.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ResearchAnalysis.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.error("Error fetching Business Services research:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getInstitutionalResearch = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      institutionalServices: { $exists: true, $ne: [] },
      $or: [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await ResearchAnalysis.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await ResearchAnalysis.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data,
    });
  } catch (error) {
    console.error("Error fetching Institutional research:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getResearchAnalysisById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const item = await ResearchAnalysis.findById(id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Research analysis not found" });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Fetch failed" });
  }
};

export const deleteResearchAnalysis = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const doc = await ResearchAnalysis.findByIdAndDelete(id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // Delete all associated files in documents array
    if (Array.isArray(doc.documents)) {
      doc.documents.forEach((filename) => {
        const filePath = path.join("uploads", filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Failed to delete file ${filename}:`, err);
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Research document and associated files deleted successfully.",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ],
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Contact.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Fetched contacts successfully",
      data: contacts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.query;
    await Contact.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "Contact deleted successfully" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting contact",
      error: err.message,
    });
  }
};

export const addPlan = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      discount,
      keyFeatures,
      duration,
      serviceTypeId,
      deliveryPreference,
      serviceChoice,
    } = req.body;

    if (
      !title ||
      !description ||
      !amount ||
      !duration ||
      !serviceTypeId ||
      !deliveryPreference ||
      !serviceChoice
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled.",
      });
    }

    const newPlan = new Plan({
      title,
      description,
      amount,
      discount,
      keyFeatures,
      duration,
      serviceTypeId,
      deliveryPreference,
      serviceChoice,
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan: newPlan,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create plan", error });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.query;
    const updatedPlan = await Plan.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedPlan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update plan", error });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await Plan.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete plan", error });
  }
};

export const getAllPlansInAdmin = async (req, res) => {
  try {
    const plans = await Plan.find().populate("serviceTypeId");
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch plans", error });
  }
};

export const getPlanByIdInAdmin = async (req, res) => {
  try {
    const { id } = req.query;
    const plan = await Plan.findById(id).populate("serviceTypeId");

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    res.status(200).json({ success: true, plan });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch plan", error });
  }
};

export const getFreePlanUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    // Find all free plans
    const plans = await Plan.find({ serviceChoice: "free" }).select("userId");

    const userIds = plans.map((plan) => plan.userId);

    const query = {
      _id: { $in: userIds },
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users,
      totalUsers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error fetching free plan users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching free plan users.",
    });
  }
};

export const getIndividualPlanUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const plans = await Plan.find({ serviceChoice: "individual" }).select(
      "userId"
    );
    const userIds = plans.map((plan) => plan.userId);

    const query = {
      _id: { $in: userIds },
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users,
      totalUsers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error fetching individual plan users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching individual plan users.",
    });
  }
};

export const getBusinessPlanUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const plans = await Plan.find({ serviceChoice: "business" }).select(
      "userId"
    );
    const userIds = plans.map((plan) => plan.userId);

    const query = {
      _id: { $in: userIds },
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users,
      totalUsers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error fetching business plan users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching business plan users.",
    });
  }
};

export const getInstitutionalPlanUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const plans = await Plan.find({ serviceChoice: "institutional" }).select(
      "userId"
    );
    const userIds = plans.map((plan) => plan.userId);

    const query = {
      _id: { $in: userIds },
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users,
      totalUsers,
      currentPage: Number(page),
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error("Error fetching institutional plan users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching institutional plan users.",
    });
  }
};

export const verifyUserByAdmin = async (req, res) => {
  try {
    const { status, userId } = req.body; // status: "approved", "rejected", or "pending"

    // Validate status
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status", status: false });
    }

    // Update user status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { adminVerified: status },
      { new: true }
    ).select("-otp -otpExpiresAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    res.status(200).json({
      message: `User verification status updated to '${status}'`,
      status: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getDashboardCount = async (req, res) => {
  try {
    // Get all plans with required fields
    const plans = await Plan.find(
      {},
      {
        individualBusinessServices: 1,
        businessServices: 1,
        institutionalServices: 1,
        totalPrice: 1,
      }
    ).lean();

    // Amount counters
    let individualBusinessServicesAmount = 0;
    let businessServicesAmount = 0;
    let institutionalServicesAmount = 0;

    for (const plan of plans) {
      const ibsCount = plan.individualBusinessServices?.length || 0;
      const bsCount = plan.businessServices?.length || 0;
      const insCount = plan.institutionalServices?.length || 0;

      if (ibsCount > 0)
        individualBusinessServicesAmount += plan.totalPrice || 0;
      if (bsCount > 0) businessServicesAmount += plan.totalPrice || 0;
      if (insCount > 0) institutionalServicesAmount += plan.totalPrice || 0;
    }

    return res.status(200).json({
      success: true,
      stats: {
        individualBusinessServicesAmount,
        businessServicesAmount,
        institutionalServicesAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard stats.",
    });
  }
};

export const getGraphStats = async (req, res) => {
  try {
    const now = new Date();

    // Utility to get start of day/week/month/year
    const getStartOf = (unit) => {
      const d = new Date(now);
      if (unit === "day") {
        d.setHours(0, 0, 0, 0);
      } else if (unit === "week") {
        const day = d.getDay(); // 0 (Sun) - 6 (Sat)
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
      } else if (unit === "month") {
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
      } else if (unit === "3month") {
        d.setMonth(d.getMonth() - 2);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
      } else if (unit === "6month") {
        d.setMonth(d.getMonth() - 5);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
      } else if (unit === "year") {
        d.setMonth(0);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
      }
      return d;
    };

    const ranges = {
      "1d": getStartOf("day"),
      "1w": getStartOf("week"),
      "1m": getStartOf("month"),
      "3m": getStartOf("3month"),
      "6m": getStartOf("6month"),
      "1y": getStartOf("year"),
    };

    const stats = {};

    for (const [label, fromDate] of Object.entries(ranges)) {
      const plans = await Plan.find({
        createdAt: { $gte: fromDate, $lte: now },
      })
        .select("totalPrice")
        .lean();

      const count = plans.length;
      const totalAmount = plans.reduce(
        (sum, plan) => sum + (plan.totalPrice || 0),
        0
      );

      stats[label] = { count, totalAmount };
    }

    // All-time total
    const allPlans = await Plan.find().select("totalPrice").lean();
    const totalAmountTillNow = allPlans.reduce(
      (sum, plan) => sum + (plan.totalPrice || 0),
      0
    );

    return res.status(200).json({
      success: true,
      stats,
      totalAmountTillNow,
    });
  } catch (error) {
    console.error("Error fetching graph stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching graph stats.",
    });
  }
};

export const getUserDetailInAdmin = async (req, res) => {
  try {
    const { userId } = req.query;

    // Fetch user
    const user = await User.findById(userId).select("-otp -otpExpiresAt");
    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    // Fetch all plans of the user (latest first)
    const plans = await Plan.find({ userId })
      .sort({ createdAt: -1 })
      .populate("freeOfferings")
      .populate("businessServices")
      .populate("institutionalServices")
      .populate("individualBusinessServices")
      .lean();

    res.status(200).json({
      message: "User fetched successfully",
      status: true,
      data: {
        user,
        plans,
      },
    });
  } catch (error) {
    console.error("Error in getUserDetailInAdmin:", error);
    res.status(500).json({ message: "Server Error", status: false });
  }
};

export const updateNewsletterStatus = async (req, res) => {
  try {
    const { email, status } = req.body;

    if (!email || !["Subscribed", "Unsubscribed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Valid email and status ('Subscribed' or 'Unsubscribed') are required",
      });
    }

    const subscriber = await NewsletterSubscriber.findOne({ email });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    subscriber.status = status;
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating subscription status",
      error,
    });
  }
};

export const replyToContact = async (req, res) => {
  try {
    const { contactId, reply, adminName = "Admin" } = req.body;

    if (!contactId || !reply) {
      return res.status(400).json({
        success: false,
        message: "contactId and reply are required.",
      });
    }

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact entry not found.",
      });
    }

    const subject = `Re: Your message to our team`;
    const html = `
      <h3>Hi ${contact.firstName},</h3>
      <p><strong>Your message:</strong><br>${contact.message}</p>
      <hr />
      <p><strong>Reply from ${adminName}:</strong><br>${reply}</p>
      <p>Best regards,<br/>${adminName}</p>
    `;

    // await sendMail({ to: contact.email, subject, html });

    // Optionally update reply in DB
    contact.reply = reply;
    contact.repliedBy = adminName;
    contact.repliedAt = new Date();
    contact.replied = "Replied";
    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully.",
    });
  } catch (error) {
    console.error("Error replying to contact:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const addTestimonial = async (req, res) => {
  try {
    const { name, role, message, index = 0 } = req.body;
    const image = req.files?.image?.[0]?.filename || "";

    if (!name || !role || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required" });
    }

    const newTestimonial = new Testimonial({
      image,
      name,
      role,
      message,
      index,
    });
    await newTestimonial.save();

    res.status(200).json({
      success: true,
      message: "Testimonial added",
      data: newTestimonial,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.query;
    const { name, role, message } = req.body;

    if (!id || !name || !role || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields except image are required",
      });
    }

    // Build update object conditionally
    const updateFields = { name, role, message };

    // If new image is uploaded, include it
    const newImage = req.files?.image?.[0]?.filename;
    if (newImage) {
      updateFields.image = newImage;
    }

    const updated = await Testimonial.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res
      .status(200)
      .json({ success: true, data: updated, message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.query;
    const deleted = await Testimonial.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ index: 1 });
    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTestimonialById = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }
    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestimonialIndex = async (req, res) => {
  try {
    const { index, id } = req.body;

    // Validate input
    if (typeof index !== "number" || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Index must be a non-negative number",
      });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid testimonial ID is required",
      });
    }

    // Update the testimonial
    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      { $set: { index } },
      { new: true, runValidators: true }
    );

    if (!updatedTestimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // Optionally: Reorder other testimonials if needed
    // This would prevent duplicate indexes if that's a requirement
    // await Testimonial.updateMany(
    //   { index: { $gte: index }, _id: { $ne: id } },
    //   { $inc: { index: 1 } }
    // );

    res.status(200).json({
      success: true,
      message: "Testimonial order updated successfully",
      data: updatedTestimonial,
    });
  } catch (error) {
    console.error("Error updating testimonial index:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const addUserGraph = async (req, res) => {
  try {
    const { amount, profitPercent, serviceChoice, serviceSelected } = req.body;

    // Validate required fields
    if (
      !serviceChoice ||
      !serviceSelected ||
      typeof serviceSelected !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "serviceChoice and a single serviceSelected (as a string) are required",
      });
    }

    // Check if serviceSelected contains multiple values (comma)
    if (serviceSelected.includes(",")) {
      return res.status(400).json({
        success: false,
        message: "Only one service can be selected at a time",
      });
    }

    // Create and save the entry
    const newEntry = new UserGraph({
      amount,

      profitPercent,
      serviceChoice,
      serviceSelected,
    });

    await newEntry.save();

    res.status(201).json({
      success: true,
      message: "UserGraph entry created successfully",
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while adding UserGraph",
      error: error.message,
    });
  }
};

export const getAllUserGraphs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", serviceChoice } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic filter
    const filter = {};

    if (search) {
      filter.$or = [
        { serviceChoice: { $regex: search, $options: "i" } },
        { serviceSelected: { $regex: search, $options: "i" } },
      ];
    }

    if (serviceChoice) {
      filter.serviceChoice = serviceChoice;
    }

    const [data, total] = await Promise.all([
      UserGraph.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      UserGraph.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "UserGraph list fetched successfully",
      total,
      page: pageNum,
      limit: limitNum,
      data,
    });
  } catch (error) {
    console.error("Error in getAllUserGraphs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getUserGraphById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "ID parameter is required" });
    }

    const userGraph = await UserGraph.findById(id);

    if (!userGraph) {
      return res
        .status(404)
        .json({ success: false, message: "UserGraph not found" });
    }

    res.status(200).json({
      success: true,
      message: "UserGraph fetched successfully",
      data: userGraph,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateUserGraph = async (req, res) => {
  try {
    const { amount, profitPercent, serviceChoice, serviceSelected, id } =
      req.body;

    if (
      !amount ||
      !profitPercent ||
      !serviceChoice ||
      !serviceSelected ||
      typeof serviceSelected !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "serviceChoice and a single serviceSelected (as string) are required",
      });
    }

    if (serviceSelected.includes(",")) {
      return res.status(400).json({
        success: false,
        message: "Only one service can be selected at a time",
      });
    }
    const updatedEntry = await UserGraph.findByIdAndUpdate(
      id,
      {
        amount,
        profitPercent,
        serviceChoice,
        serviceSelected,
      },
      { new: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({
        success: false,
        message: "UserGraph entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "UserGraph entry updated successfully",
      data: updatedEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating UserGraph",
      error: error.message,
    });
  }
};

export const deleteUserGraph = async (req, res) => {
  try {
    const deleted = await UserGraph.findByIdAndDelete(req.query.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "UserGraph not found" });
    }

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// export const getUserGrowthChart = async (req, res) => {
//   try {
//     const userId = req?.user?.id;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "userId is required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid userId format",
//       });
//     }

//     // Step 1: Fetch latest plan
//     const latestPlan = await Plan.findOne({ userId }).sort({ createdAt: -1 });

//     if (!latestPlan) {
//       return res.status(404).json({
//         success: false,
//         message: "No plan found for this user",
//       });
//     }

//     const {
//       freeOfferings = [],
//       individualBusinessServices = [],
//       businessServices = [],
//       institutionalServices = [],
//       startDate: planStartDate,
//       endDate: planEndDate,
//     } = latestPlan;

//     // Step 2: Determine serviceChoice based on first non-empty array
//     let serviceChoice = null;

//     if (freeOfferings.length > 0) serviceChoice = "free";
//     else if (individualBusinessServices.length > 0)
//       serviceChoice = "individual";
//     else if (businessServices.length > 0) serviceChoice = "business";
//     else if (institutionalServices.length > 0) serviceChoice = "institutional";

//     if (!serviceChoice) {
//       return res.status(400).json({
//         success: false,
//         message: "No active services found in plan",
//       });
//     }

//     // ✅ Step 3: Total number of selected services (not number of non-empty categories)
//     const totalServicesSelected =
//       freeOfferings.length +
//       individualBusinessServices.length +
//       businessServices.length +
//       institutionalServices.length;

//     const serviceSelected = String(totalServicesSelected);

//     // Step 4: Find UserGraph entry
//     const entry = await UserGraph.findOne({
//       serviceChoice,
//       serviceSelected,
//     }).sort({ createdAt: -1 });

//     if (!entry) {
//       return res.status(404).json({
//         success: false,
//         message: `No UserGraph found for serviceChoice: ${serviceChoice}, serviceSelected: ${serviceSelected}`,
//       });
//     }

//     const { amount, profitPercent } = entry;

//     // Step 5: Build growth chart
//     const durationMapping = {
//       "15D": 0.5,
//       "1M": 1,
//       "1.5M": 1.5,
//       "2M": 2,
//       "2.5M": 2.5,
//       "3M": 3,
//       "3.5M": 3.5,
//       "4M": 4,
//       "4.5M": 4.5,
//       "5M": 5,
//       "5.5M": 5.5,
//       "6M": 6,
//     };

//     const chart = [];

//     for (const [label, months] of Object.entries(durationMapping)) {
//       const futureDate = moment(planStartDate).add(months, "months");

//       if (futureDate.isAfter(moment(planEndDate))) break;

//       const gain = (amount * profitPercent * (months / 6)) / 100;
//       const finalAmount = Math.round(amount + gain);

//       chart.push({
//         label,
//         date: futureDate.format("YYYY-MM-DD"),
//         amount: finalAmount,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Growth chart generated successfully",
//       data: chart,
//       serviceChoice,
//       serviceSelected,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error while generating growth chart",
//       error: error.message,
//     });
//   }
// };

export const getUserGrowthChart = async (req, res) => {
  try {
    const userId = req?.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // Step 1: Fetch all plans for the user
    const userPlans = await Plan.find({ userId }).sort({ createdAt: -1 });

    if (!userPlans || userPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No plans found for this user",
      });
    }

    const durationMapping = {
      "15D": 0.5,
      "1M": 1,
      "1.5M": 1.5,
      "2M": 2,
      "2.5M": 2.5,
      "3M": 3,
      "3.5M": 3.5,
      "4M": 4,
      "4.5M": 4.5,
      "5M": 5,
      "5.5M": 5.5,
      "6M": 6,
    };

    const allCharts = [];
    const serviceCombinations = new Set(); // Track unique service combinations

    for (const plan of userPlans) {
      const {
        freeOfferings = [],
        individualBusinessServices = [],
        businessServices = [],
        institutionalServices = [],
        startDate: planStartDate,
        endDate: planEndDate,
        _id: planId,
        createdAt,
      } = plan;

      // Determine serviceChoice
      let serviceChoice = null;
      if (freeOfferings.length > 0) serviceChoice = "free";
      else if (individualBusinessServices.length > 0)
        serviceChoice = "individual";
      else if (businessServices.length > 0) serviceChoice = "business";
      else if (institutionalServices.length > 0)
        serviceChoice = "institutional";

      if (!serviceChoice) continue; // skip if no valid service

      const totalServicesSelected =
        freeOfferings.length +
        individualBusinessServices.length +
        businessServices.length +
        institutionalServices.length;

      const serviceSelected = String(totalServicesSelected);

      // Create a unique key for this service combination
      const serviceKey = `${serviceChoice}-${serviceSelected}`;

      // Skip if we've already processed this combination
      if (serviceCombinations.has(serviceKey)) continue;
      serviceCombinations.add(serviceKey);

      const entry = await UserGraph.findOne({
        serviceChoice,
        serviceSelected,
      }).sort({ createdAt: -1 });

      if (!entry) continue;

      const { amount, profitPercent } = entry;

      const chart = [];

      for (const [label, months] of Object.entries(durationMapping)) {
        const futureDate = moment(planStartDate).add(months, "months");

        if (futureDate.isAfter(moment(planEndDate))) break;

        const gain = (amount * profitPercent * (months / 6)) / 100;
        const finalAmount = Math.round(amount + gain);

        chart.push({
          label,
          date: futureDate.format("YYYY-MM-DD"),
          amount: finalAmount,
        });
      }

      allCharts.push({
        planId,
        createdAt,
        serviceChoice,
        serviceSelected,
        chart,
      });
    }

    if (allCharts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid UserGraph entries found for any of the plans",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Unique growth charts generated successfully",
      data: allCharts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while generating growth chart",
      error: error.message,
    });
  }
};

export const getAllTransaction = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // First, find matching user IDs if search keyword is provided
    let userFilter = {};

    if (search) {
      const regex = new RegExp(search, "i");
      const matchingUsers = await User.find({
        $or: [{ firstName: regex }, { lastName: regex }],
      }).select("_id");

      const userIds = matchingUsers.map((user) => user._id);
      userFilter.userId = { $in: userIds };
    }

    const totalTransactions = await Transaction.countDocuments(userFilter);

    const transactions = await Transaction.find(userFilter)
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      message: "Transaction history fetched successfully",
      status: true,
      totalTransactions,
      currentPage: pageNum,
      totalPages: Math.ceil(totalTransactions / limitNum),
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

export const getUsersCounts = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    // Find all free plans
    const free = await Plan.find({ serviceChoice: "free" }).select("userId");

    const individual = await Plan.find({ serviceChoice: "individual" }).select(
      "userId"
    );
    const business = await Plan.find({ serviceChoice: "business" }).select(
      "userId"
    );
    const institutional = await Plan.find({
      serviceChoice: "institutional",
    }).select("userId");

    const freeOfferings = free.map((plan) => plan.userId);
    const individualBusinessServices = individual.map((plan) => plan.userId);
    const businessServices = business.map((plan) => plan.userId);
    const institutionalServices = institutional.map((plan) => plan.userId);

    return res.status(200).json({
      message: "Users counts fetched successfully",
      status: true,
      data: {
        totalUsers,
        freeOfferings: freeOfferings.length,
        individualBusinessServices: individualBusinessServices.length,
        businessServices: businessServices.length,
        institutionalServices: institutionalServices.length,
      },
    });
  } catch (error) {
    console.error("Error fetching users counts:", error);
    return res.status(500).json({
      message: "Server Error",
      status: false,
    });
  }
};

export const addUpdatePlanAmount = async (req, res) => {
  try {
    const {
      basePrice,
      gst,
      platformFee,
      selectPercentage,
      gstStatus,
      platformFeeStatus,
    } = req.body;

    if (!basePrice || !gst || !platformFee || !selectPercentage) {
      return res
        .status(400)
        .json({ message: "Missing required fields", status: false });
    }

    // Check if any PlanAmount document exists
    const existing = await PlanAmountModel.findOne();

    let result;
    if (existing) {
      result = await PlanAmountModel.findByIdAndUpdate(
        existing._id,
        {
          basePrice,
          gst,
          platformFee,
          selectPercentage,
          gstStatus,
          platformFeeStatus,
        },
        { new: true }
      );
    } else {
      result = await PlanAmountModel.create({
        basePrice,
        gst,
        platformFee,
        selectPercentage,
        gstStatus,
        platformFeeStatus,
      });
    }

    res.status(200).json({
      message: "Plan amount saved successfully",
      data: result,
      status: true,
    });
  } catch (error) {
    console.error("Error in addUpdatePlanAmount:", error);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const updatePlanAmountStatus = async (req, res) => {
  try {
    const { gstStatus, platformFeeStatus } = req.body;

    // Fetch existing PlanAmount
    const existing = await PlanAmountModel.findOne();

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Plan amount not found", status: false });
    }

    // Prepare update object
    const updateFields = {};
    if (typeof gstStatus === "boolean") updateFields.gstStatus = gstStatus;
    if (typeof platformFeeStatus === "boolean")
      updateFields.platformFeeStatus = platformFeeStatus;

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid status fields provided", status: false });
    }

    // Update status fields
    const updated = await PlanAmountModel.findByIdAndUpdate(
      existing._id,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({
      message: "Plan status updated successfully",
      data: updated,
      status: true,
    });
  } catch (error) {
    console.error("Error in updatePlanAmountStatus:", error);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getPlanAmount = async (req, res) => {
  try {
    const planAmount = await PlanAmountModel.findOne();
    if (!planAmount) {
      return res
        .status(404)
        .json({ message: "Plan amount not found", status: false });
    }
    res.status(200).json({
      message: "Plan amount fetched successfully",
      data: planAmount,
      status: true,
    });
  } catch (error) {
    console.error("Error in getPlanAmount:", error);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Banner Controllers

export const getBanner = async (req, res) => {
  try {
    // Get the single banner document
    const banner = await Banner.findOne();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner retrieved",
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addOrUpdateBanner = async (req, res) => {
  try {
    const {
      title,
      altText,
      activeCustomers,
      projectCompleted,
      customerSatisfaction,
      shlok,
    } = req.body;

    const image = req.files?.image?.[0]?.filename || "";

    // Validation
    if (
      !title ||
      !altText ||
      !activeCustomers ||
      !projectCompleted ||
      !customerSatisfaction ||
      !shlok
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // if (!image && !req.query.skipImageCheck) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Image is required",
    //   });
    // }

    // Check if banner exists
    const existingBanner = await Banner.findOne();

    let banner;

    if (existingBanner) {
      // Update existing banner
      const updateData = {
        title,
        altText,
        activeCustomers,
        projectCompleted,
        customerSatisfaction,
        shlok,
      };

      // Only update image if new one is provided
      if (image) {
        updateData.image = image;
      }

      banner = await Banner.findOneAndUpdate({}, updateData, {
        new: true,
        upsert: true, // Create if doesn't exist
      });

      res.status(200).json({
        success: true,
        message: "Banner updated",
        data: banner,
      });
    } else {
      // Create new banner
      banner = new Banner({
        image,
        title,
        altText,
        activeCustomers,
        projectCompleted,
        customerSatisfaction,
        shlok,
      });

      await banner.save();

      res.status(201).json({
        success: true,
        message: "Banner created",
        data: banner,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    // Delete the single banner document
    const result = await Banner.deleteOne();

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// WhyChooseUs Controllers
export const addWhyChooseUs = async (req, res) => {
  try {
    const { heading, content } = req.body;

    if (!heading || !content) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const newWhyChooseUs = new WhyChooseUs({ heading, content });
    await newWhyChooseUs.save();

    res.status(200).json({
      success: true,
      message: "WhyChooseUs added",
      data: newWhyChooseUs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWhyChooseUsById = async (req, res) => {
  try {
    const whyChooseUs = await WhyChooseUs.findById(req.query.id);
    if (!whyChooseUs) {
      return res
        .status(404)
        .json({ success: false, message: "WhyChooseUs not found" });
    }
    res.status(200).json({ success: true, data: whyChooseUs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllWhyChooseUs = async (req, res) => {
  try {
    const whyChooseUs = await WhyChooseUs.find();
    res.status(200).json({ success: true, data: whyChooseUs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWhyChooseUs = async (req, res) => {
  try {
    const { id } = req.query;
    const updatedWhyChooseUs = await WhyChooseUs.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    if (!updatedWhyChooseUs) {
      return res
        .status(404)
        .json({ success: false, message: "WhyChooseUs not found" });
    }
    res.status(200).json({
      success: true,
      message: "WhyChooseUs updated",
      data: updatedWhyChooseUs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWhyChooseUs = async (req, res) => {
  try {
    const deletedWhyChooseUs = await WhyChooseUs.findByIdAndDelete(
      req.query.id
    );
    if (!deletedWhyChooseUs) {
      return res
        .status(404)
        .json({ success: false, message: "WhyChooseUs not found" });
    }
    res.status(200).json({ success: true, message: "WhyChooseUs deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// HowItWorks Controllers
export const addHowItWorks = async (req, res) => {
  try {
    const { content } = req.body;
    const image = req.files?.image?.[0]?.filename || "";

    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content); // content is expected as JSON string
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid content format" });
    }

    if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Content must be a non-empty array",
      });
    }

    if (parsedContent.length > 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 content blocks are allowed",
      });
    }

    const hasInvalidBlock = parsedContent.some(
      (block) => !block.title || !block.description
    );
    if (hasInvalidBlock) {
      return res.status(400).json({
        success: false,
        message: "Each content block must have a title and description",
      });
    }

    const newHowItWorks = new HowItWorks({ image, content: parsedContent });
    await newHowItWorks.save();

    res.status(200).json({
      success: true,
      message: "HowItWorks added",
      data: newHowItWorks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHowItWorksById = async (req, res) => {
  try {
    const howItWorks = await HowItWorks.findById(req.query.id);
    if (!howItWorks) {
      return res
        .status(404)
        .json({ success: false, message: "HowItWorks not found" });
    }
    res.status(200).json({ success: true, data: howItWorks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllHowItWorks = async (req, res) => {
  try {
    const howItWorks = await HowItWorks.find();
    res.status(200).json({ success: true, data: howItWorks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHowItWorks = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required for update",
      });
    }

    const updateData = {};

    // Handle image
    const image = req.files?.image?.[0]?.filename;
    if (image) {
      updateData.image = image;
    }

    // Handle content
    if (req.body.content) {
      let parsedContent;
      try {
        parsedContent = JSON.parse(req.body.content);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid content format",
        });
      }

      if (!Array.isArray(parsedContent) || parsedContent.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Content must be a non-empty array",
        });
      }

      if (parsedContent.length > 3) {
        return res.status(400).json({
          success: false,
          message: "Maximum 3 content blocks are allowed",
        });
      }

      const hasInvalidBlock = parsedContent.some(
        (block) => !block.title || !block.description
      );
      if (hasInvalidBlock) {
        return res.status(400).json({
          success: false,
          message: "Each content block must have a title and description",
        });
      }

      updateData.content = parsedContent;
    }

    const updatedHowItWorks = await HowItWorks.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedHowItWorks) {
      return res.status(404).json({
        success: false,
        message: "HowItWorks not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "HowItWorks updated",
      data: updatedHowItWorks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteHowItWorks = async (req, res) => {
  try {
    const deletedHowItWorks = await HowItWorks.findByIdAndDelete(req.query.id);
    if (!deletedHowItWorks) {
      return res
        .status(404)
        .json({ success: false, message: "HowItWorks not found" });
    }
    res.status(200).json({ success: true, message: "HowItWorks deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Newsletter Controllers
export const addOrUpdateNewsletter = async (req, res) => {
  try {
    const { id, title } = req.body;
    const image = req.files?.image?.[0]?.filename;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // If `id` is present, update existing newsletter
    if (id) {
      const updateData = { title };
      if (image) updateData.image = image;

      const updatedNewsletter = await Newsletter.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
        }
      );

      if (!updatedNewsletter) {
        return res
          .status(404)
          .json({ success: false, message: "Newsletter not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Newsletter updated successfully",
        data: updatedNewsletter,
      });
    }

    // Else, create a new newsletter
    const newNewsletter = new Newsletter({
      title,
      image: image || "",
    });

    await newNewsletter.save();

    res.status(200).json({
      success: true,
      message: "Newsletter added successfully",
      data: newNewsletter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNewsletter = async (req, res) => {
  try {
    const newsletter = await Newsletter.findOne();
    if (!newsletter) {
      return res
        .status(404)
        .json({ success: false, message: "Newsletter not found" });
    }
    res.status(200).json({ success: true, data: newsletter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// OurObjectives Controllers
export const addOrUpdateOurObjectives = async (req, res) => {
  try {
    const { id, heading, content } = req.body;

    if (!heading || !content) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // If `id` is provided, update the document
    if (id) {
      const updatedObjective = await OurObjectives.findByIdAndUpdate(
        id,
        { heading, content },
        { new: true }
      );

      if (!updatedObjective) {
        return res.status(404).json({
          success: false,
          message: "OurObjectives not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "OurObjectives updated successfully",
        data: updatedObjective,
      });
    }

    // Check if a document already exists
    const existing = await OurObjectives.findOne();
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Only one OurObjectives document is allowed. Please update the existing one.",
        data: existing,
      });
    }

    // If not, create a new document
    const newOurObjectives = new OurObjectives({ heading, content });
    await newOurObjectives.save();

    res.status(200).json({
      success: true,
      message: "OurObjectives added successfully",
      data: newOurObjectives,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getAllOurObjectives = async (req, res) => {
  try {
    const ourObjectives = await OurObjectives.find();
    res.status(200).json({ success: true, data: ourObjectives });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ContactUs Controllers
export const addOrUpdateContactUs = async (req, res) => {
  try {
    const { id, officeLocation, email, phone } = req.body;

    if (!officeLocation || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // If `id` is provided, update the existing document
    if (id) {
      const updatedContact = await ContactUs.findByIdAndUpdate(
        id,
        { officeLocation, email, phone },
        { new: true }
      );

      if (!updatedContact) {
        return res.status(404).json({
          success: false,
          message: "ContactUs not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "ContactUs updated successfully",
        data: updatedContact,
      });
    }

    // Check if a ContactUs document already exists
    const existing = await ContactUs.findOne();
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Only one ContactUs document is allowed. Please update the existing one.",
        data: existing,
      });
    }

    // Create new ContactUs document
    const newContactUs = new ContactUs({ officeLocation, email, phone });
    await newContactUs.save();

    res.status(200).json({
      success: true,
      message: "ContactUs added successfully",
      data: newContactUs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getContactUs = async (req, res) => {
  try {
    const contactUs = await ContactUs.findOne();
    res.status(200).json({ success: true, data: contactUs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

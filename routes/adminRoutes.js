import express from "express";
import {
  policyUpdate,
  getPolicy,
  loginAdmin,
  adminSignup,
  getAdminDetail,
  resetAdminPassword,
  updateAdminDetail,
  addUpdateMembership,
  getAllMembership,
  addFAQ,
  updateFAQ,
  getAllFAQs,
  getFAQById,
  CreateBankName,
  updateBankName,
  deleteBankName,
  getAllBankNamesInAdmin,
  getBankNameByIdInAdmin,
  createCategory,
  updateCategory,
  getAllCategories,
  getCategoryById,
  deleteCategory,
  addInvestmentPlan,
  updateInvestmentPlan,
  getAllPlans,
  getPlanById,
  updatePlanFlags,
  getAllUsers,
  getUsersWithInvestment,
} from "../controllers/adminController.js";

import {authMiddleware} from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/* ----------------------------------
   🔐 Admin Authentication
---------------------------------- */
router.post("/adminSignup", adminSignup);
router.post("/loginAdmin", loginAdmin);
router.get("/getAdminDetail", authMiddleware, getAdminDetail);
router.post("/resetAdminPassword", authMiddleware, resetAdminPassword);
router.post("/updateAdminDetail", authMiddleware, updateAdminDetail);

/* ----------------------------------
   📄 Policies
---------------------------------- */
router.post("/policyUpdate", policyUpdate);
router.get("/getPolicy", authMiddleware, getPolicy);

/* ----------------------------------
   👥 Membership Management
---------------------------------- */
router.post("/addUpdateMembership", authMiddleware, addUpdateMembership);
router.get("/getAllMembership", authMiddleware, getAllMembership);

/* ----------------------------------
   ❓ FAQ Management
---------------------------------- */
router.post("/addFAQ", addFAQ);
router.post("/updateFAQ", authMiddleware, updateFAQ);
router.get("/getAllFAQs", authMiddleware, getAllFAQs);
router.get("/getFAQById", authMiddleware, getFAQById);

/* ----------------------------------
   🏦 Bank Name Management
---------------------------------- */
router.post(
  "/createBankName",
  uploadProfile.fields([{ name: "icon", maxCount: 1 }]),
  authMiddleware,
  CreateBankName
);
router.get("/getAllBankNamesInAdmin", authMiddleware, getAllBankNamesInAdmin);
router.get("/getBankNameByIdInAdmin", authMiddleware, getBankNameByIdInAdmin);
router.post("/updateBankName", authMiddleware, updateBankName);
router.post("/deleteBankName", authMiddleware, deleteBankName);

/* ----------------------------------
   🗂️ Investment Categories
---------------------------------- */
router.post(
  "/createCategory",
  uploadProfile.fields([{ name: "icon", maxCount: 1 }]),
  authMiddleware,
  createCategory
);
router.post(
  "/updateCategory",
  uploadProfile.fields([{ name: "icon", maxCount: 1 }]),
  authMiddleware,
  updateCategory
);
router.get("/getAllCategories", authMiddleware, getAllCategories);
router.get("/getCategoryById", authMiddleware, getCategoryById);
router.get("/deleteCategory", authMiddleware, deleteCategory);

/* ----------------------------------
   📈 Investment Plans
---------------------------------- */
router.post("/addInvestmentPlan", authMiddleware, addInvestmentPlan);
router.post("/updateInvestmentPlan", authMiddleware, updateInvestmentPlan);
router.get("/getAllPlans", authMiddleware, getAllPlans);
router.get("/getPlanById", authMiddleware, getPlanById);
router.post("/updatePlanFlags", authMiddleware, updatePlanFlags);

/* ----------------------------------
   📈 Users Management
---------------------------------- */
router.get("/getAllUsers", authMiddleware, getAllUsers);
router.get("/getUsersWithInvestment", authMiddleware, getUsersWithInvestment);

   

export default router;

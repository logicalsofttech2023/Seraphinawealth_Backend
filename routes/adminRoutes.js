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
} from "../controllers/adminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";
const router = express.Router();

router.post("/adminSignup", adminSignup);

router.post("/loginAdmin", loginAdmin);

router.get("/getAdminDetail", authMiddleware, getAdminDetail);

router.post("/resetAdminPassword", authMiddleware, resetAdminPassword);

router.post("/updateAdminDetail", authMiddleware, updateAdminDetail);

router.post("/policyUpdate", policyUpdate);

router.get("/getPolicy", authMiddleware, getPolicy);

router.post("/addUpdateMembership", authMiddleware, addUpdateMembership);

router.get("/getAllMembership", authMiddleware, getAllMembership);

router.post("/addFAQ", addFAQ);

router.post("/updateFAQ", authMiddleware, updateFAQ);

router.get("/getAllFAQs", authMiddleware, getAllFAQs);

router.get("/getFAQById", authMiddleware, getFAQById);

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

export default router;

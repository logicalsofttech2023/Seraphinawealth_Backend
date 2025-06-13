import express from "express";
import {
  generateOtp,
  verifyOtp,
  resendOtp,
  completeRegistration,
  updateProfile,
  getUserById,
  addMoneyToWallet,
  getPolicyByType,
  getFAQList,
  getFAQByFaqId,
  getWalletDetails,
  getTransactionHistory,
  withdrawFromWallet,
  linkBankAccount,
  getBankAccount,
  updateBankAccount,
  getBankAccountById,
  getAllBankNames,
  getBankNameById,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/generateOtp", generateOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);
router.post(
  "/completeRegistration",
  uploadProfile.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "aadharFrontImage", maxCount: 1 },
    { name: "aadharBackImage", maxCount: 1 },
    { name: "panFrontImage", maxCount: 1 },
    { name: "panBackImage", maxCount: 1 },
  ]),
  completeRegistration
);
router.post(
  "/updateProfile",
  authMiddleware,
  uploadProfile.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "aadharFrontImage", maxCount: 1 },
    { name: "aadharBackImage", maxCount: 1 },
    { name: "panFrontImage", maxCount: 1 },
    { name: "panBackImage", maxCount: 1 },
  ]),
  updateProfile
);
router.get("/getUserById", authMiddleware, getUserById);
router.post("/addMoneyToWallet", authMiddleware, addMoneyToWallet);
router.get("/getWalletDetails", authMiddleware, getWalletDetails);
router.get("/getTransactionHistory", authMiddleware, getTransactionHistory);
router.post("/withdrawFromWallet", authMiddleware, withdrawFromWallet);
router.post("/linkBankAccount", authMiddleware, linkBankAccount);
router.get("/getBankAccount", authMiddleware, getBankAccount);
router.post("/updateBankAccount", authMiddleware, updateBankAccount);
router.get("/getBankAccountById", authMiddleware, getBankAccountById);

router.get("/getPolicyByType", getPolicyByType);

router.get("/getFAQList", getFAQList);
router.get("/getFAQByFaqId", getFAQByFaqId);
router.get("/getAllBankNames", getAllBankNames);
router.get("/getBankNameById", getBankNameById);

export default router;

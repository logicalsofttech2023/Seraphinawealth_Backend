import express from "express";
import {
  generateOtp,
  verifyOtp,
  resendOtp,
  completeRegistration,
  updateProfile,
  getUserById,
  addMoneyToWallet,
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

export default router;

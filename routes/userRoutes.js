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
  getNotificationsByUserId,
  updateProfileImage,
  createInvestmentPurchase,
  getAllInvestmentPlansInWeb,
  getAllInvestmentPlansInApp,
  getInvestmentPlanById,
  getInvestmentPurchasesInWeb,
  getInvestmentPurchasesInApp,
  getInvestmentPerformance,
  getInvestmentPerformanceChart,
  getPopularPlans,
  getFeaturedPlans,
  getAllCategory,
  getServiceTypes,
  getAgreementContent,
  subscribeNewsletter,
  getAllResearchAnalysis,
  createContact,
  getAllFreeOfferingsInUser,
  getAllIndividualBusinessServicesInUser,
  getAllBusinessServicesInUser,
  getAllInstitutionalServicesInUser,
  getAllFAQsInUser,
  createPlan,
  getPlanByUserId,
  hasUserTakenPlan,
  renewPlan,
  getResearchByUserPlan,
  getAllTestimonialsInUser,
} from "../controllers/userController.js";

import {authMiddleware, optionalAuthMiddleware} from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/* ----------------------------------
   🔐 OTP & Registration
---------------------------------- */
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

/* ----------------------------------
   👤 User Profile
---------------------------------- */
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
router.post(
  "/updateProfileImage",
  authMiddleware,
  uploadProfile.fields([{ name: "profileImage", maxCount: 1 }]),
  updateProfileImage
);
router.get("/getUserById", authMiddleware, getUserById);

/* ----------------------------------
   💰 Wallet & Transactions
---------------------------------- */
router.post("/addMoneyToWallet", authMiddleware, addMoneyToWallet);
router.get("/getWalletDetails", authMiddleware, getWalletDetails);
router.get("/getTransactionHistory", authMiddleware, getTransactionHistory);
router.post("/withdrawFromWallet", authMiddleware, withdrawFromWallet);

/* ----------------------------------
   🏦 Bank Account Management
---------------------------------- */
router.post("/linkBankAccount", authMiddleware, linkBankAccount);
router.get("/getBankAccount", authMiddleware, getBankAccount);
router.post("/updateBankAccount", authMiddleware, updateBankAccount);
router.get("/getBankAccountById", authMiddleware, getBankAccountById);
router.get("/getAllBankNames", getAllBankNames);
router.get("/getBankNameById", getBankNameById);

/* ----------------------------------
   📈 Investment Plans & Purchases
---------------------------------- */
router.post("/createInvestmentPurchase", authMiddleware, createInvestmentPurchase);
router.get("/getAllInvestmentPlansInWeb", optionalAuthMiddleware, getAllInvestmentPlansInWeb);
router.get("/getAllInvestmentPlansInApp", optionalAuthMiddleware, getAllInvestmentPlansInApp);
router.get("/getInvestmentPlanById", optionalAuthMiddleware, getInvestmentPlanById);
router.get("/getInvestmentPurchasesInWeb", optionalAuthMiddleware, getInvestmentPurchasesInWeb);
router.get("/getInvestmentPurchasesInApp", optionalAuthMiddleware, getInvestmentPurchasesInApp);
router.get("/getInvestmentPerformance", authMiddleware, getInvestmentPerformance);
router.get("/getInvestmentPerformanceChart", authMiddleware, getInvestmentPerformanceChart);
router.get("/getPopularPlans", optionalAuthMiddleware, getPopularPlans);
router.get("/getFeaturedPlans", optionalAuthMiddleware, getFeaturedPlans);
router.get("/getAllCategory", getAllCategory);

/* ----------------------------------
   🔔 Notifications
---------------------------------- */
router.get("/getNotificationsByUserId", authMiddleware, getNotificationsByUserId);

/* ----------------------------------
   📃 Policy & FAQ
---------------------------------- */
router.get("/getPolicyByType", getPolicyByType);
router.get("/getFAQList", getFAQList);
router.get("/getFAQByFaqId", getFAQByFaqId);
router.get("/getServiceTypes", getServiceTypes);
router.get("/getAgreementContent", getAgreementContent);
router.post("/subscribeNewsletter", subscribeNewsletter);
router.get("/getAllResearchAnalysis", getAllResearchAnalysis);
router.post("/createContact", createContact);


router.get("/getAllFreeOfferingsInUser", getAllFreeOfferingsInUser);
router.get("/getAllIndividualBusinessServicesInUser", getAllIndividualBusinessServicesInUser);

router.get("/getAllBusinessServicesInUser", getAllBusinessServicesInUser);
router.get("/getAllInstitutionalServicesInUser", getAllInstitutionalServicesInUser);
router.get("/getAllFAQsInUser", getAllFAQsInUser);
router.post("/createPlan",authMiddleware, createPlan);
router.get("/renewPlan",authMiddleware, renewPlan);

router.get("/getPlanByUserId",authMiddleware, getPlanByUserId);
router.get("/hasUserTakenPlan",optionalAuthMiddleware, hasUserTakenPlan);
router.get("/getResearchByUserPlan",optionalAuthMiddleware, getResearchByUserPlan);
router.get("/getAllTestimonialsInUser", getAllTestimonialsInUser);



export default router;

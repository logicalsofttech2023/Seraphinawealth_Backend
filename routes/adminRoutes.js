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
  addServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
  updateAgreementContent,
  getAgreementContentInAdmin,
  getAllResearchAnalysisInAdmin,
  getResearchAnalysisById,
  deleteResearchAnalysis,
  addOrUpdateResearchAnalysis,
  getAllSubscribers,
  deleteSubscriber,
  getAllContacts,
  deleteContact,
  addPlan,
  updatePlan,
  getAllPlansInAdmin,
  getPlanByIdInAdmin,
  getServiceTypesInAdmin,
  addFreeOffering,
  getAllFreeOfferings,
  getFreeOfferingById,
  updateFreeOffering,
  deleteFreeOffering,
  addIndividualBusinessService,
  getAllIndividualBusinessServices,
  getIndividualBusinessServiceById,
  updateIndividualBusinessService,
  deleteIndividualBusinessService,
  addBusinessService,
  getAllBusinessServices,
  getBusinessServiceById,
  updateBusinessService,
  deleteBusinessService,
  addInstitutionalService,
  getAllInstitutionalServices,
  getInstitutionalServiceById,
  updateInstitutionalService,
  deleteInstitutionalService,
} from "../controllers/adminController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadProfile } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/* ---------------------------------------------
 🔐 Admin Authentication
----------------------------------------------*/
router.post("/adminSignup", adminSignup);
router.post("/loginAdmin", loginAdmin);
router.get("/getAdminDetail", authMiddleware, getAdminDetail);
router.post("/resetAdminPassword", authMiddleware, resetAdminPassword);
router.post("/updateAdminDetail", authMiddleware, updateAdminDetail);

/* ---------------------------------------------
 📄 Privacy & Terms Policy
----------------------------------------------*/
router.post(
  "/policyUpdate",
  uploadProfile.fields([{ name: "image", maxCount: 1 }]),
  policyUpdate
);
router.get("/getPolicy", authMiddleware, getPolicy);

/* ---------------------------------------------
 👥 Membership Management
----------------------------------------------*/
router.post("/addUpdateMembership", authMiddleware, addUpdateMembership);
router.get("/getAllMembership", authMiddleware, getAllMembership);

/* ---------------------------------------------
 ❓ FAQ Management
----------------------------------------------*/
router.post("/addFAQ", addFAQ);
router.post("/updateFAQ", authMiddleware, updateFAQ);
router.get("/getAllFAQs", authMiddleware, getAllFAQs);
router.get("/getFAQById", authMiddleware, getFAQById);

/* ---------------------------------------------
 🏦 Bank Name Management
----------------------------------------------*/
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

/* ---------------------------------------------
 🗂️ Investment Category Management
----------------------------------------------*/
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

/* ---------------------------------------------
 📈 Investment Plan Management
----------------------------------------------*/
router.post("/addInvestmentPlan", authMiddleware, addInvestmentPlan);
router.post("/updateInvestmentPlan", authMiddleware, updateInvestmentPlan);
router.get("/getAllPlans", authMiddleware, getAllPlans);
router.get("/getPlanById", authMiddleware, getPlanById);
router.post("/updatePlanFlags", authMiddleware, updatePlanFlags);

/* ---------------------------------------------
 👤 User Management
----------------------------------------------*/
router.get("/getAllUsers", authMiddleware, getAllUsers);
router.get("/getUsersWithInvestment", authMiddleware, getUsersWithInvestment);

/* ---------------------------------------------
 📦 Service Type Management
----------------------------------------------*/
router.post("/addServiceType", authMiddleware, addServiceType);
router.get("/getAllServiceTypes", authMiddleware, getAllServiceTypes);
router.get("/getServiceTypeById", authMiddleware, getServiceTypeById);
router.post("/updateServiceType", authMiddleware, updateServiceType);
router.post("/deleteServiceType", authMiddleware, deleteServiceType);


router.post("/addFreeOffering", authMiddleware, addFreeOffering);
router.get("/getAllFreeOfferings", authMiddleware, getAllFreeOfferings);
router.get("/getFreeOfferingById", authMiddleware, getFreeOfferingById);
router.post("/updateFreeOffering", authMiddleware, updateFreeOffering);
router.post("/deleteFreeOffering", authMiddleware, deleteFreeOffering);

router.post("/addIndividualBusinessService", authMiddleware, addIndividualBusinessService);
router.get("/getAllIndividualBusinessServices", authMiddleware, getAllIndividualBusinessServices);
router.get("/getIndividualBusinessServiceById", authMiddleware, getIndividualBusinessServiceById);
router.post("/updateIndividualBusinessService", authMiddleware, updateIndividualBusinessService);
router.post("/deleteIndividualBusinessService", authMiddleware, deleteIndividualBusinessService);


router.post("/addBusinessService", authMiddleware, addBusinessService);
router.get("/getAllBusinessServices", authMiddleware, getAllBusinessServices);
router.get("/getBusinessServiceById", authMiddleware, getBusinessServiceById);
router.post("/updateBusinessService", authMiddleware, updateBusinessService);
router.post("/deleteBusinessService", authMiddleware, deleteBusinessService);


router.post("/addInstitutionalService", authMiddleware, addInstitutionalService);
router.get("/getAllInstitutionalServices", authMiddleware, getAllInstitutionalServices);
router.get("/getInstitutionalServiceById", authMiddleware, getInstitutionalServiceById);
router.post("/updateInstitutionalService", authMiddleware, updateInstitutionalService);
router.post("/deleteInstitutionalService", authMiddleware, deleteInstitutionalService);

/* ---------------------------------------------
 📜 Agreement Content Management
----------------------------------------------*/
router.post("/updateAgreementContent", authMiddleware, updateAgreementContent);
router.get(
  "/getAgreementContentInAdmin",
  authMiddleware,
  getAgreementContentInAdmin
);

/* ---------------------------------------------
 📚 Research Analysis Management
----------------------------------------------*/
router.post(
  "/addOrUpdateResearchAnalysis",
  uploadProfile.fields([{ name: "file", maxCount: 100 }]),
  authMiddleware,
  addOrUpdateResearchAnalysis
);

router.get(
  "/getAllResearchAnalysis",
  authMiddleware,
  getAllResearchAnalysisInAdmin
);
router.get("/getResearchAnalysisById", authMiddleware, getResearchAnalysisById);
router.get("/deleteResearchAnalysis", authMiddleware, deleteResearchAnalysis);

router.post("/deleteSubscriber", authMiddleware, deleteSubscriber);
router.get("/getAllSubscribers", authMiddleware, getAllSubscribers);
router.get("/getAllContacts", authMiddleware, getAllContacts);
router.post("/deleteContact", authMiddleware, deleteContact);


router.get("/getServiceTypesInAdmin", authMiddleware, getServiceTypesInAdmin);


router.post("/addPlan", authMiddleware, addPlan);
router.post("/updatePlan", authMiddleware, updatePlan);
router.get("/getAllPlansInAdmin", authMiddleware, getAllPlansInAdmin);
router.get("/getPlanByIdInAdmin", authMiddleware, getPlanByIdInAdmin);



export default router;

// models/AgreementForm.js
import mongoose from "mongoose";

const agreementFormSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    serviceTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceType",
      required: true,
    },
    deliveryPreference: {
      type: String,
      required: true,
      enum: ["Inbox", "Dashboard", "Both"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    serviceChoice: {
      type: String,
      enum: ["free", "paid"],
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("AgreementForm", agreementFormSchema);

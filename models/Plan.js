import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deliveryPreference: {
      type: String,
      enum: ["email", "dashboard", "both"],
      required: true,
    },
    serviceChoice: {
      type: String,
      enum: ["free", "individual", "business", "institutional"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "renewed"],
      default: "active",
    },
    freeOfferings: [
      { type: mongoose.Schema.Types.ObjectId, ref: "FreeOffering" },
    ],
    individualBusinessServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IndividualBusinessService",
      },
    ],
    businessServices: [
      { type: mongoose.Schema.Types.ObjectId, ref: "BusinessService" },
    ],
    institutionalServices: [
      { type: mongoose.Schema.Types.ObjectId, ref: "InstitutionalService" },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);

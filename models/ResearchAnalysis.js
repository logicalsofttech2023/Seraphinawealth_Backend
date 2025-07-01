// models/ResearchAnalysis.js
import mongoose from "mongoose";

const researchAnalysisSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    documents: {
      type: [String],
      default: [],
    },
    serviceChoice: {
      type: String,
      enum: ["free", "individual", "business", "institutional"],
      required: true,
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
  },
  { timestamps: true }
);

export default mongoose.model("ResearchAnalysis", researchAnalysisSchema);

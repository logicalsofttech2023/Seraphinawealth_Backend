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
    document: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ResearchAnalysis", researchAnalysisSchema);

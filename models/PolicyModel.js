import mongoose from "mongoose";

// Policy Schema
const policySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["about", "terms", "privacy"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// FAQ Schema
const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["general", "pricing", "account", "technical"],
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Export both models
export const Policy = mongoose.model("Policy", policySchema);
export const FAQ = mongoose.model("FAQ", faqSchema);

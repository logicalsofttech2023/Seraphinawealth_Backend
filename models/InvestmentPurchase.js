import mongoose from "mongoose";

const investmentPurchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InvestmentPlan",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  payoutFrequency: {
    type: String,
    enum: ["monthly", "quarterly", "yearly"],
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["active", "matured", "cancelled"],
    default: "active",
  },
});

const InvestmentPurchase = mongoose.model(
  "InvestmentPurchase",
  investmentPurchaseSchema
);
export default InvestmentPurchase;

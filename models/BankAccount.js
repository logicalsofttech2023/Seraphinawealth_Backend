import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bankNameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankName",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const bankNameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BankAccount", bankAccountSchema);
export const BankName = mongoose.model("BankName", bankNameSchema);

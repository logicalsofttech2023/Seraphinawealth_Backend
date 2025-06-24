import mongoose from "mongoose";

const agreementContentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("AgreementContent", agreementContentSchema);

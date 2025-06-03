import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  planType: { type: String, enum: ["monthly", "6months"], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["active", "expired"], default: "active" },
});

const Membership = mongoose.model("Membership", membershipSchema);
export default Membership;

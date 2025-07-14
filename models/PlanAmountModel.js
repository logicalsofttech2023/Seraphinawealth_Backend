import mongoose from "mongoose";

const planAmountSchema = new mongoose.Schema(
  {
    basePrice: {
      type: Number,
      required: true, 
    },
    selectPercentage: {
      type: [Number],
      required: true,
    },
    gst: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    gstStatus:{
      type: Boolean,
      default: true,
    },
    platformFeeStatus: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PlanAmount", planAmountSchema);

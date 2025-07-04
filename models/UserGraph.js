import mongoose from "mongoose";

const userGraphSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      default: 0,
    },
    profitPercent: {
      type: Number,
      required: [true, "Profit percent is required"],
      default: 0,
    },
    serviceChoice: {
      type: String,
      enum: ["free", "individual", "business", "institutional"],
    },
    serviceSelected: {
      type: String,
      enum: ["1", "2", "3", "4"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserGraph", userGraphSchema);

import mongoose from "mongoose";

const userGraphSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      default: 0,
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      default: "6m",
    },
    profitPercent: {
      type: Number,
      required: [true, "Profit percent is required"],
      default: 0,
    },
    freeOfferings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FreeOffering",
      },
    ],
    individualBusinessServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IndividualBusinessService",
      },
    ],
    businessServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessService",
      },
    ],
    institutionalServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InstitutionalService",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("UserGraph", userGraphSchema);

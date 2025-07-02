import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Subscribed", "Unsubscribed"],
      default: "Subscribed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);

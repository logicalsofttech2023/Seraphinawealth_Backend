// models/Testimonial.js
import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Testimonial', testimonialSchema);

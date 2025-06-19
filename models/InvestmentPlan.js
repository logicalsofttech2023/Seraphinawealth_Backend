import mongoose from 'mongoose';

const investmentPlanSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentCategory',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  minAmount: {
    type: Number,
    required: true
  },
  durationMonths: {
    type: Number,
    required: true
  },
  roi: {
    type: String, // e.g. "12.5% p.a"
    required: true
  },
  risk: {
    type: String, // e.g. "Low", "Moderate", "High"
    enum: ['Low', 'Moderate', 'High'],
    default: 'Moderate'
  },
  additionalInfo: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);
export default InvestmentPlan;

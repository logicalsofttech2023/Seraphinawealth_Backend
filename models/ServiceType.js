import mongoose from "mongoose";

// Service Type Schema
const serviceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Free Offering Schema
const freeOfferingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Individual Business Service Schema
const individualBusinessServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Business Service Schema
const businessServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Institutional Service Schema
const institutionalServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceType", serviceTypeSchema);
export const FreeOffering = mongoose.model("FreeOffering", freeOfferingSchema);
export const IndividualBusinessService = mongoose.model(
  "IndividualBusinessService",
  individualBusinessServiceSchema
);
export const BusinessService = mongoose.model(
  "BusinessService",
  businessServiceSchema
);
export const InstitutionalService = mongoose.model(
  "InstitutionalService",
  institutionalServiceSchema
);

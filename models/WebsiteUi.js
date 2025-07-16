import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  image: {
    type: String,
  },
  title: {
    type: String,
  },
  altText: {
    type: String,
    required: true,
  },
  activeCustomers: {
    type: Number,
    required: true,
  },
  projectCompleted: {
    type: Number,
    required: true,
  },
  customerSatisfaction: {
    type: Number,
    required: true,
  },
  shlok: {
    type: String,
  },
});

const whyChooseUsSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
  },
  content: {
    type: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        points: {
          type: [String],
          validate: {
            validator: function (value) {
              return value.length <= 4;
            },
            message: "Each content block can have at most 4 points",
          },
        },
      },
    ],
    validate: {
      validator: function (value) {
        return value.length <= 3;
      },
      message: "You can provide a maximum of 3 content blocks",
    },
  },
});

const howItWorksSchema = new mongoose.Schema({
  image: {
    type: String,
  },
  content: {
    type: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    validate: {
      validator: function (value) {
        return value.length <= 3;
      },
      message: "You can provide a maximum of 3 content blocks",
    },
  },
});

const newsletterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
});

const ourObjectivesSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
  },
  content: {
    type: [String],
    required: true,
    validate: {
      validator: function (value) {
        return value.length <= 4;
      },
      message: "You can provide a maximum of 4 objectives",
    },
  },
});

const contactUsSchema = new mongoose.Schema({
  officeLocation: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);
const WhyChooseUs = mongoose.model("WhyChooseUs", whyChooseUsSchema);
const HowItWorks = mongoose.model("HowItWorks", howItWorksSchema);
const Newsletter = mongoose.model("Newsletter", newsletterSchema);
const OurObjectives = mongoose.model("OurObjectives", ourObjectivesSchema);
const ContactUs = mongoose.model("ContactUs", contactUsSchema);

export {
  Banner,
  WhyChooseUs,
  HowItWorks,
  Newsletter,
  OurObjectives,
  ContactUs,
};

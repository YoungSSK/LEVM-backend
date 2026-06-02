import mongoose from "mongoose";
const occupationCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const OccupationCategory = mongoose.model(
  "OccupationCategory",
  occupationCategorySchema,
);
export default OccupationCategory;

import mongoose from "mongoose";
const occupationSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OccupationCategory",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
occupationSchema.index({ categoryId: 1, name: 1 }, { unique: true });

const Occupation = mongoose.model("Occupation", occupationSchema);
export default Occupation;

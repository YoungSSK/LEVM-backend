import mongoose from "mongoose";

const listeningSetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    part: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "elementary", "intermediate", "upper_intermediate", "advanced"],
      default: "intermediate",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    xpReward: {
      type: Number,
      default: 15,
      min: 0,
      max: 1000,
    },
    passThreshold: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowedPackageIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Package",
      default: [],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

listeningSetSchema.index({ part: 1, status: 1, order: 1 });

const ListeningSet = mongoose.model("ListeningSet", listeningSetSchema);

export default ListeningSet;

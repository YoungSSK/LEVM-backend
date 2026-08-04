import mongoose from "mongoose";

const listeningAudioGroupSchema = new mongoose.Schema(
  {
    setId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListeningSet",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
    audioUrl: {
      type: String,
      required: true,
      trim: true,
    },
    audioPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    transcript: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

listeningAudioGroupSchema.index({ setId: 1, order: 1 });

const ListeningAudioGroup = mongoose.model("ListeningAudioGroup", listeningAudioGroupSchema);

export default ListeningAudioGroup;

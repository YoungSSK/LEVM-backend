import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashPassword: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: function () {
        return this.username;
      },
    },
    avatar: {
      publicId: {
        type: String,
        default: null,
      },
      secureUrl: {
        type: String,
        default: null,
      },
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    occupationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Occupation",
      default: null,
    },
    occupationCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OccupationCategory",
      default: null,
    },
    streak: {
      type: Number,
      default: 0,
    },

    xp: {
      type: Number,
      default: 0,
    },
    timezone: {
      type: String,
      default: "Asia/Ho_Chi_Minh",
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    freezeCount: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ xp: -1 });
userSchema.index({ username: "text" });
userSchema.index({ role: 1, xp: -1 });

const User = mongoose.model("User", userSchema);

export default User;

import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: {
      type: String,
      enum: ["admin", "premium", "free"],
      default: "free",
    },
    country: { type: String, default: "Unknown" },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
    loginCount: { type: Number, default: 0 },
    resetToken: { type: String }, // Password reset token
    resetTokenExpiry: { type: Date }, // Token expiration time
  },
  { timestamps: true },
);

// Story Schema
const storySchema = new mongoose.Schema(
  {
    storyId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    image: { type: String }, // Base64 encoded image data or image URL
    audioUrl: { type: String }, // Base64 encoded audio data or audio URL
    excerpt: { type: String }, // Short description/preview text
    accessLevel: { type: String, enum: ["free", "premium"], default: "free" },
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Comment Schema
const commentSchema = new mongoose.Schema(
  {
    commentId: { type: String, required: true, unique: true },
    storyId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true },
);

// Like Schema
const likeSchema = new mongoose.Schema(
  {
    likeId: { type: String, required: true, unique: true },
    storyId: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

// Rating Schema
const ratingSchema = new mongoose.Schema(
  {
    ratingId: { type: String, required: true, unique: true },
    storyId: { type: String, required: true },
    userId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

// Login Log Schema
const loginLogSchema = new mongoose.Schema(
  {
    logId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    ip: { type: String },
    country: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Error Log Schema
const errorLogSchema = new mongoose.Schema(
  {
    logId: { type: String, required: true, unique: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    error: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// User Story Read Schema
const userStoryReadSchema = new mongoose.Schema(
  {
    readId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    storyId: { type: String, required: true },
    storyTitle: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
storySchema.index({ storyId: 1 });
storySchema.index({ published: 1 });
storySchema.index({ category: 1 });
commentSchema.index({ storyId: 1 });
commentSchema.index({ userId: 1 });
likeSchema.index({ storyId: 1, userId: 1 }, { unique: true });
ratingSchema.index({ storyId: 1, userId: 1 }, { unique: true });
userStoryReadSchema.index({ userId: 1 });
userStoryReadSchema.index({ storyId: 1 });
userStoryReadSchema.index({ userId: 1, storyId: 1 });
userStoryReadSchema.index({ timestamp: -1 });

// Export models
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Story =
  mongoose.models.Story || mongoose.model("Story", storySchema);
export const Comment =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);
export const Like = mongoose.models.Like || mongoose.model("Like", likeSchema);
export const Rating =
  mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
export const LoginLog =
  mongoose.models.LoginLog || mongoose.model("LoginLog", loginLogSchema);
export const ErrorLog =
  mongoose.models.ErrorLog || mongoose.model("ErrorLog", errorLogSchema);
export const UserStoryRead =
  mongoose.models.UserStoryRead ||
  mongoose.model("UserStoryRead", userStoryReadSchema);

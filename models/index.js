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
    city: { type: String }, // New field for city detection
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

// Indexes for better performance and statistics queries

// === USER SCHEMA INDEXES ===
// Statistics optimized indexes
userSchema.index({ createdAt: -1 }); // For user registration analytics
userSchema.index({ active: 1, createdAt: -1 }); // For active user registration counts
userSchema.index({ type: 1, active: 1 }); // For user type distribution analytics
userSchema.index({ country: 1, active: 1 }); // For country-based user analytics
userSchema.index({ active: 1 }); // For active user counts

// === STORY SCHEMA INDEXES ===
storySchema.index({ published: 1 });
storySchema.index({ category: 1 });
// Statistics optimized indexes
storySchema.index({ published: 1, createdAt: -1 }); // For published stories with date sorting
storySchema.index({ published: 1, category: 1 }); // For category-based analytics
storySchema.index({ published: 1, accessLevel: 1 }); // For access level analytics
storySchema.index({ published: 1, views: -1 }); // For most viewed stories
storySchema.index({ published: 1, likeCount: -1 }); // For most liked stories
storySchema.index({ published: 1, averageRating: -1 }); // For top rated stories
storySchema.index({ createdAt: -1 }); // For story publication analytics

// === COMMENT SCHEMA INDEXES ===
commentSchema.index({ storyId: 1 });
commentSchema.index({ userId: 1 });
// Statistics optimized indexes
commentSchema.index({ createdAt: -1 }); // For comment analytics by date
commentSchema.index({ storyId: 1, createdAt: -1 }); // For story comment history

// === LIKE SCHEMA INDEXES ===
likeSchema.index({ storyId: 1, userId: 1 }, { unique: true });
// Statistics optimized indexes
likeSchema.index({ storyId: 1 }); // For story like aggregations
likeSchema.index({ createdAt: -1 }); // For like analytics by date
likeSchema.index({ storyId: 1, createdAt: -1 }); // For story like history

// === RATING SCHEMA INDEXES ===
ratingSchema.index({ storyId: 1, userId: 1 }, { unique: true });
// Statistics optimized indexes
ratingSchema.index({ storyId: 1 }); // For story rating aggregations
ratingSchema.index({ createdAt: -1 }); // For rating analytics by date
ratingSchema.index({ storyId: 1, createdAt: -1 }); // For story rating history

// === LOGIN LOG SCHEMA INDEXES ===
// Statistics optimized indexes
loginLogSchema.index({ timestamp: -1 }); // For login analytics by date
loginLogSchema.index({ timestamp: -1, success: 1 }); // For successful login analytics
loginLogSchema.index({ country: 1, timestamp: -1 }); // For country-based login analytics
loginLogSchema.index({ userId: 1, timestamp: -1 }); // For user-specific login history
loginLogSchema.index({ success: 1 }); // For login success rate analytics

// === ERROR LOG SCHEMA INDEXES ===
// Statistics optimized indexes
errorLogSchema.index({ timestamp: -1 }); // For error analytics by date
errorLogSchema.index({ endpoint: 1, timestamp: -1 }); // For endpoint-specific error analytics

// === USER STORY READ SCHEMA INDEXES ===
userStoryReadSchema.index({ userId: 1 });
userStoryReadSchema.index({ storyId: 1 });
userStoryReadSchema.index({ userId: 1, storyId: 1 });
userStoryReadSchema.index({ timestamp: -1 });
// Statistics optimized indexes
userStoryReadSchema.index({ storyId: 1, timestamp: -1 }); // For story reading analytics
userStoryReadSchema.index({ userId: 1, timestamp: -1 }); // For user reading analytics

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

// Import and export StoryStatsCache
import StoryStatsCache from "./StoryStatsCache.js";
export { StoryStatsCache };

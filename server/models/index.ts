import mongoose from "mongoose";
import {
  User,
  Story,
  Comment,
  Rating,
  Payment,
  LoginLog,
  ErrorLog,
} from "@shared/api";

// User Schema
const userSchema = new mongoose.Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "premium", "free"],
      default: "free",
    },
    isAgeVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "none"],
      default: "none",
    },
    subscriptionExpiry: Date,
    lastLogin: Date,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Story Schema
const storySchema = new mongoose.Schema<Story>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    accessLevel: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    image: String, // Base64 encoded image data
  },
  {
    timestamps: true,
  },
);

// Comment Schema
const commentSchema = new mongoose.Schema<Comment>(
  {
    storyId: {
      type: String,
      required: true,
      ref: "Story",
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    username: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Rating Schema
const ratingSchema = new mongoose.Schema<Rating>(
  {
    storyId: {
      type: String,
      required: true,
      ref: "Story",
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

// Payment Schema
const paymentSchema = new mongoose.Schema<Payment>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: String,
    subscriptionType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Login Log Schema
const loginLogSchema = new mongoose.Schema<LoginLog>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    email: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Error Log Schema
const errorLogSchema = new mongoose.Schema<ErrorLog>(
  {
    userId: {
      type: String,
      ref: "User",
    },
    error: {
      type: String,
      required: true,
    },
    stack: String,
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

storySchema.index({ title: "text", excerpt: "text", content: "text" });
storySchema.index({ category: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ accessLevel: 1 });
storySchema.index({ isPublished: 1 });
storySchema.index({ rating: -1 });
storySchema.index({ viewCount: -1 });
storySchema.index({ createdAt: -1 });

commentSchema.index({ storyId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ createdAt: -1 });

ratingSchema.index({ storyId: 1, userId: 1 }, { unique: true });

loginLogSchema.index({ userId: 1 });
loginLogSchema.index({ createdAt: -1 });
loginLogSchema.index({ ipAddress: 1 });

errorLogSchema.index({ severity: 1 });
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ endpoint: 1 });

// Create and export models
export const UserModel = mongoose.model<User>("User", userSchema);
export const StoryModel = mongoose.model<Story>("Story", storySchema);
export const CommentModel = mongoose.model<Comment>("Comment", commentSchema);
export const RatingModel = mongoose.model<Rating>("Rating", ratingSchema);
export const PaymentModel = mongoose.model<Payment>("Payment", paymentSchema);
export const LoginLogModel = mongoose.model<LoginLog>(
  "LoginLog",
  loginLogSchema,
);
export const ErrorLogModel = mongoose.model<ErrorLog>(
  "ErrorLog",
  errorLogSchema,
);

// Helper function to convert MongoDB document to API response format
export const toUserResponse = (doc: any): User => ({
  id: doc._id.toString(),
  email: doc.email,
  username: doc.username,
  role: doc.role,
  isAgeVerified: doc.isAgeVerified,
  isActive: doc.isActive,
  subscriptionStatus: doc.subscriptionStatus,
  subscriptionExpiry: doc.subscriptionExpiry,
  createdAt: doc.createdAt,
  lastLogin: doc.lastLogin,
});

export const toStoryResponse = (doc: any): Story => ({
  id: doc._id.toString(),
  title: doc.title,
  excerpt: doc.excerpt,
  content: doc.content,
  author: doc.author,
  category: doc.category,
  tags: doc.tags,
  accessLevel: doc.accessLevel,
  isPublished: doc.isPublished,
  rating: doc.rating,
  ratingCount: doc.ratingCount,
  viewCount: doc.viewCount,
  commentCount: doc.commentCount,
  image: doc.image,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const toCommentResponse = (doc: any): Comment => ({
  id: doc._id.toString(),
  storyId: doc.storyId,
  userId: doc.userId,
  username: doc.username,
  content: doc.content,
  isEdited: doc.isEdited,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const toLoginLogResponse = (doc: any): LoginLog => ({
  id: doc._id.toString(),
  userId: doc.userId,
  email: doc.email,
  ipAddress: doc.ipAddress,
  country: doc.country,
  userAgent: doc.userAgent,
  success: doc.success,
  createdAt: doc.createdAt,
});

export const toErrorLogResponse = (doc: any): ErrorLog => ({
  id: doc._id.toString(),
  userId: doc.userId,
  error: doc.error,
  stack: doc.stack,
  endpoint: doc.endpoint,
  method: doc.method,
  ipAddress: doc.ipAddress,
  userAgent: doc.userAgent,
  severity: doc.severity,
  createdAt: doc.createdAt,
});

/**
 * Shared types between client and server for the storytelling platform
 */

// User roles and access levels
export type UserRole = "admin" | "premium" | "free";

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string; // Optional for security - only included when needed
  role: UserRole;
  isAgeVerified: boolean;
  isActive: boolean;
  country?: string;
  subscriptionStatus: "active" | "expired" | "none";
  subscriptionExpiry?: Date;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  isAgeVerified: boolean;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  subscriptionStatus?: "active" | "expired" | "none";
  subscriptionExpiry?: Date;
}

export interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  accessLevel: "free" | "premium";
  isPublished: boolean;
  rating: number;
  ratingCount: number;
  viewCount: number;
  commentCount: number;
  image?: string; // Base64 encoded image data
  audioUrl?: string; // URL to audio file
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  username: string;
  content: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  storyId: string;
  userId: string;
  score: number; // 1-5 stars
  createdAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  subscriptionType: "monthly" | "yearly";
  createdAt: Date;
}

export interface LoginLog {
  id: string;
  userId: string;
  email: string;
  ipAddress: string;
  country: string;
  userAgent: string;
  success: boolean;
  createdAt: Date;
}

export interface ErrorLog {
  id: string;
  userId?: string;
  error: string;
  stack?: string;
  endpoint: string;
  method: string;
  ipAddress: string;
  userAgent: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  dateOfBirth: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface StoriesResponse {
  stories: Story[];
  total: number;
  page: number;
  limit: number;
}

export interface StoryRequest {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  accessLevel: "free" | "premium";
  isPublished: boolean;
}

export interface CommentRequest {
  storyId: string;
  content: string;
}

export interface RatingRequest {
  storyId: string;
  score: number;
}

export interface PaymentRequest {
  subscriptionType: "monthly" | "yearly";
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalStories: number;
  totalRevenue: number;
  activeSubscriptions: number;
  recentLogins: LoginLog[];
  recentErrors: ErrorLog[];
}

// Example response type (keeping for compatibility)
export interface DemoResponse {
  message: string;
}

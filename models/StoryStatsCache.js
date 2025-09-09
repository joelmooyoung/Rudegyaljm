import mongoose from "mongoose";

const StoryStatsCacheSchema = new mongoose.Schema(
  {
    storyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Cached calculated stats
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },

    // Cache metadata
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
    calculationDurationMs: {
      type: Number,
      default: 0,
    },

    // For debugging/monitoring
    calculationVersion: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
StoryStatsCacheSchema.index({ lastCalculated: -1 });

export default mongoose.models.StoryStatsCache ||
  mongoose.model("StoryStatsCache", StoryStatsCacheSchema);

import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

// Client for frontend (using anon key)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (using service role key)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Utility function to get admin client or throw error
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable for admin operations",
    );
  }
  return supabaseAdmin;
}

// Database helper functions
export const db = {
  // Users
  async getUser(id) {
    const { data, error } = await getSupabaseAdmin()
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUserByUsername(username) {
    const { data, error } = await getSupabaseAdmin()
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
    return data;
  },

  async createUser(userData) {
    const { data, error } = await getSupabaseAdmin()
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(id, updates) {
    const { data, error } = await getSupabaseAdmin()
      .from("users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Stories
  async getStories(filters = {}) {
    let query = getSupabaseAdmin().from("stories").select(`
        *,
        author:users(username),
        like_count:likes(count),
        rating_stats:ratings(rating)
      `);

    if (filters.published !== undefined) {
      query = query.eq("is_published", filters.published);
    }

    if (filters.featured !== undefined) {
      query = query.eq("is_featured", filters.featured);
    }

    if (filters.authorId) {
      query = query.eq("author_id", filters.authorId);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Calculate aggregated data
    return data.map((story) => ({
      ...story,
      likeCount: story.like_count?.length || 0,
      averageRating:
        story.rating_stats?.length > 0
          ? story.rating_stats.reduce((sum, r) => sum + r.rating, 0) /
            story.rating_stats.length
          : 0,
      ratingCount: story.rating_stats?.length || 0,
    }));
  },

  async getStory(id) {
    const { data, error } = await getSupabaseAdmin()
      .from("stories")
      .select(
        `
        *,
        author:users(username),
        comments(*),
        likes(*),
        ratings(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createStory(storyData) {
    const { data, error } = await getSupabaseAdmin()
      .from("stories")
      .insert(storyData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStory(id, updates) {
    const { data, error } = await getSupabaseAdmin()
      .from("stories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async incrementViewCount(storyId) {
    const { error } = await getSupabaseAdmin()
      .from("stories")
      .update({ view_count: db.raw("view_count + 1") })
      .eq("id", storyId);

    if (error) throw error;
  },

  // Comments
  async getComments(storyId) {
    const { data, error } = await getSupabaseAdmin()
      .from("comments")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createComment(commentData) {
    const { data, error } = await getSupabaseAdmin()
      .from("comments")
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Likes
  async getLikes(storyId) {
    const { data, error } = await getSupabaseAdmin()
      .from("likes")
      .select("*")
      .eq("story_id", storyId);

    if (error) throw error;
    return data;
  },

  async getUserLike(storyId, userId) {
    const { data, error } = await getSupabaseAdmin()
      .from("likes")
      .select("*")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async toggleLike(storyId, userId) {
    // Check if like exists
    const existingLike = await this.getUserLike(storyId, userId);

    if (existingLike) {
      // Remove like
      const { error } = await getSupabaseAdmin()
        .from("likes")
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", userId);

      if (error) throw error;
      return { liked: false };
    } else {
      // Add like
      const { data, error } = await getSupabaseAdmin()
        .from("likes")
        .insert({ story_id: storyId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return { liked: true, data };
    }
  },

  // Ratings
  async getRatings(storyId) {
    const { data, error } = await getSupabaseAdmin()
      .from("ratings")
      .select("*")
      .eq("story_id", storyId);

    if (error) throw error;
    return data;
  },

  async getUserRating(storyId, userId) {
    const { data, error } = await getSupabaseAdmin()
      .from("ratings")
      .select("*")
      .eq("story_id", storyId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async upsertRating(storyId, userId, rating) {
    const { data, error } = await getSupabaseAdmin()
      .from("ratings")
      .upsert(
        {
          story_id: storyId,
          user_id: userId,
          rating: rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "story_id,user_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Logging
  async logLogin(logData) {
    const { data, error } = await getSupabaseAdmin()
      .from("login_logs")
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async logError(errorData) {
    const { data, error } = await getSupabaseAdmin()
      .from("error_logs")
      .insert(errorData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getLoginLogs(limit = 100) {
    const { data, error } = await getSupabaseAdmin()
      .from("login_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getErrorLogs(limit = 100) {
    const { data, error } = await getSupabaseAdmin()
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async clearLogs(type) {
    const table = type === "login" ? "login_logs" : "error_logs";
    const { error } = await getSupabaseAdmin()
      .from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (error) throw error;
  },
};

export default { supabaseClient, supabaseAdmin, getSupabaseAdmin, db };

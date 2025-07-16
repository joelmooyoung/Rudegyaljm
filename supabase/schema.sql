-- Supabase Database Schema for Rude Gyal Confessions
-- Run this SQL in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'free' CHECK (role IN ('admin', 'premium', 'free')),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    tags TEXT[], -- Array of tags
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id) -- Prevent duplicate likes
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id) -- One rating per user per story
);

-- Create login_logs table for admin tracking
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50),
    ip_address INET,
    country VARCHAR(100),
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    request_path VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_comments_story ON comments(story_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_story ON likes(story_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_story ON ratings(story_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (id, username, email, password_hash, role, country, is_active) 
VALUES (
    'admin1-uuid-4000-8000-000000000001',
    'admin',
    'admin@rudegyal.com',
    '$2b$10$8K5v3GYdXqJ1Cb4JO6u3MeR5s7YhG2nK9WzX4tU6vP8oQ3rL1mN0a', -- admin123
    'admin',
    'United States',
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample premium user (password: premium123)
INSERT INTO users (id, username, email, password_hash, role, country, is_active) 
VALUES (
    'premium1-uuid-4000-8000-000000000002',
    'premiumuser',
    'premium@rudegyal.com',
    '$2b$10$9L6w4HZeYrK2Db5KP7v4NeS6t8ZiH3oL0XzY5uV7wQ9pR4sM2nO1b', -- premium123
    'premium',
    'United States',
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample free user (password: free123)
INSERT INTO users (id, username, email, password_hash, role, country, is_active) 
VALUES (
    'free1-uuid-4000-8000-000000000003',
    'freeuser',
    'free@rudegyal.com',
    '$2b$10$0M7x5IafZsL3Ec6LQ8w5OfT7u9AjI4pM1YzZ6vW8xR0qS5tN3oP2c', -- free123
    'free',
    'United States',
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample stories
INSERT INTO stories (id, title, content, author_id, category, tags, is_published, is_featured) VALUES
(
    'story1-uuid-4000-8000-000000000001',
    'Midnight Desires',
    'The city lights flickered through the rain-soaked windows as Sarah pressed her palm against the cool glass. Her breath fogged the surface, creating ephemeral patterns that mirrored the chaos in her mind. Tonight was different. Tonight, she would finally tell him how she felt...',
    'admin1-uuid-4000-8000-000000000001',
    'Romance',
    ARRAY['passionate', 'city', 'romance', 'desire'],
    true,
    true
),
(
    'story2-uuid-4000-8000-000000000002',
    'Summer Heat',
    'The beach was empty except for the two of them. Maria could feel the sand between her toes, warm from the day''s sun. The waves crashed rhythmically, creating a symphony that matched the beating of her heart. When he took her hand...',
    'premium1-uuid-4000-8000-000000000002',
    'Erotic',
    ARRAY['beach', 'summer', 'sensual', 'waves'],
    true,
    false
),
(
    'story3-uuid-4000-8000-000000000003',
    'Office After Hours',
    'The elevator stopped with a soft ding, and Emma realized she wasn''t alone. The building was supposed to be empty, but there he was - tall, mysterious, and undeniably magnetic. The tension in the small space was palpable...',
    'free1-uuid-4000-8000-000000000003',
    'Workplace',
    ARRAY['office', 'tension', 'elevator', 'after-hours'],
    true,
    false
) ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO comments (story_id, user_id, username, comment) VALUES
('story1-uuid-4000-8000-000000000001', 'admin1-uuid-4000-8000-000000000001', 'admin', 'This is an amazing story! The passion really comes through.'),
('story1-uuid-4000-8000-000000000001', 'premium1-uuid-4000-8000-000000000002', 'premiumuser', 'Absolutely captivating. Looking forward to more like this.'),
('story2-uuid-4000-8000-000000000002', 'free1-uuid-4000-8000-000000000003', 'freeuser', 'The tension in this story is incredible!');

-- Insert sample likes
INSERT INTO likes (story_id, user_id) VALUES
('story1-uuid-4000-8000-000000000001', 'admin1-uuid-4000-8000-000000000001'),
('story1-uuid-4000-8000-000000000001', 'premium1-uuid-4000-8000-000000000002'),
('story2-uuid-4000-8000-000000000002', 'free1-uuid-4000-8000-000000000003')
ON CONFLICT (story_id, user_id) DO NOTHING;

-- Insert sample ratings
INSERT INTO ratings (story_id, user_id, rating) VALUES
('story1-uuid-4000-8000-000000000001', 'admin1-uuid-4000-8000-000000000001', 5),
('story1-uuid-4000-8000-000000000001', 'premium1-uuid-4000-8000-000000000002', 4),
('story2-uuid-4000-8000-000000000002', 'free1-uuid-4000-8000-000000000003', 5)
ON CONFLICT (story_id, user_id) DO NOTHING;

-- Enable Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data, admins can read all
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Stories: published stories are public, authors can manage their own
CREATE POLICY "Anyone can view published stories" ON stories FOR SELECT USING (is_published = true);
CREATE POLICY "Authors can manage own stories" ON stories FOR ALL USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Comments: public read, authenticated write
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Likes: public read, authenticated write
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Ratings: public read, authenticated write
CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage ratings" ON ratings FOR ALL USING (auth.uid() = user_id);

-- Admin-only access for logs
CREATE POLICY "Admin access to login logs" ON login_logs FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin access to error logs" ON error_logs FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

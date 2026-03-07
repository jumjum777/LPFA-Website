-- =========================================================
-- LPFA Website — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all tables
-- =========================================================

-- News Articles
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  published_date DATE NOT NULL,
  body TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  event_date TEXT,
  start_date DATE,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  time TEXT,
  price TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT DEFAULT '/contact',
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Boat Tours
CREATE TABLE IF NOT EXISTS tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  section TEXT NOT NULL,
  price TEXT NOT NULL,
  price_note TEXT,
  description TEXT NOT NULL,
  duration TEXT,
  details JSONB,
  departure_location TEXT,
  age_restriction TEXT,
  booking_info TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  peekpro_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tour Schedules (month-by-month dates)
CREATE TABLE IF NOT EXISTS tour_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
  month_order INTEGER NOT NULL,
  dates TEXT[] NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Board Meeting Documents
CREATE TABLE IF NOT EXISTS board_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  document_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin Users (role-based access)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can read published news" ON news_articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read published events" ON events
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read published tours" ON tours
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read tour schedules" ON tour_schedules
  FOR SELECT USING (true);

CREATE POLICY "Public can read published documents" ON board_documents
  FOR SELECT USING (is_published = true);

-- Authenticated admin full access
CREATE POLICY "Admin full access news" ON news_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin full access events" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin full access tours" ON tours
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin full access tour_schedules" ON tour_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin full access documents" ON board_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can read admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Super admin can manage admin_users" ON admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- =========================================================
-- Indexes
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_news_published_date ON news_articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_tours_section ON tours(section);
CREATE INDEX IF NOT EXISTS idx_tour_schedules_tour ON tour_schedules(tour_id);
CREATE INDEX IF NOT EXISTS idx_board_docs_date ON board_documents(document_date DESC);

-- =========================================================
-- Updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_updated_at BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tours_updated_at BEFORE UPDATE ON tours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

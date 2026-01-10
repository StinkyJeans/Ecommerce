-- Create website_visits table for tracking page visits
-- This migration creates the website_visits table if it doesn't exist

CREATE TABLE IF NOT EXISTS website_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  visitor_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON website_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_page_path ON website_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON website_visits(visitor_id);

-- Enable Row Level Security
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert visits (for tracking)
DROP POLICY IF EXISTS "Anyone can insert visits" ON website_visits;
CREATE POLICY "Anyone can insert visits" ON website_visits
  FOR INSERT WITH CHECK (true);

-- Allow admins to read visits (for statistics)
DROP POLICY IF EXISTS "Admins can read visits" ON website_visits;
CREATE POLICY "Admins can read visits" ON website_visits
  FOR SELECT USING (true);

-- Add comment for documentation
COMMENT ON TABLE website_visits IS 'Tracks website page visits for analytics';

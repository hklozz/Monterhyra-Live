-- Migration 006: Skapa print_files tabell och Storage bucket

-- Tabell för tryckfil-metadata
CREATE TABLE IF NOT EXISTS print_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'main', -- 'main', 'wall', 'storage'
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  customer_name TEXT,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index för snabb sökning
CREATE INDEX IF NOT EXISTS idx_print_files_order_id ON print_files(order_id);
CREATE INDEX IF NOT EXISTS idx_print_files_event_id ON print_files(event_id);
CREATE INDEX IF NOT EXISTS idx_print_files_exhibitor_id ON print_files(exhibitor_id);

-- RLS policies
ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to print_files" ON print_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to print_files" ON print_files FOR SELECT USING (true);
CREATE POLICY "Allow public update to print_files" ON print_files FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from print_files" ON print_files FOR DELETE USING (true);

-- Skapa Storage bucket för print-files (kör detta i Supabase Dashboard -> Storage om SQL inte fungerar)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('print-files', 'print-files', true) ON CONFLICT DO NOTHING;

-- ============================================================
-- KOMPLETT SETUP - Kör HELA denna fil i Supabase SQL Editor
-- Supabase Dashboard → SQL Editor → Klistra in → Run
-- ============================================================

-- ============ MIGRATION 001: Grundschema ============

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  password TEXT,
  branding JSONB,
  pricing JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  booth_data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  booth_data JSONB NOT NULL,
  pricing_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exhibitors_event_id ON exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_email ON exhibitors(email);
CREATE INDEX IF NOT EXISTS idx_orders_exhibitor_id ON orders(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to events" ON events;
DROP POLICY IF EXISTS "Allow public insert to events" ON events;
DROP POLICY IF EXISTS "Allow public update to events" ON events;
DROP POLICY IF EXISTS "Allow public delete from events" ON events;
CREATE POLICY "Allow public read access to events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert to events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to events" ON events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from events" ON events FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public insert to exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public update to exhibitors" ON exhibitors;
DROP POLICY IF EXISTS "Allow public delete from exhibitors" ON exhibitors;
CREATE POLICY "Allow public read access to exhibitors" ON exhibitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert to exhibitors" ON exhibitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to exhibitors" ON exhibitors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from exhibitors" ON exhibitors FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert to orders" ON orders;
DROP POLICY IF EXISTS "Allow public update to orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete from orders" ON orders;
CREATE POLICY "Allow public read access to orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from orders" ON orders FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ MIGRATION 002: Exhibitor auth ============

ALTER TABLE exhibitors
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exhibitors_username ON exhibitors(username) WHERE username IS NOT NULL;

-- ============ MIGRATION 003: White label ============

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS white_label JSONB;

-- ============ MIGRATION 005: event_id på orders ============

ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);

-- ============ MIGRATION 006: print_files tabell ============

CREATE TABLE IF NOT EXISTS print_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'main',
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  customer_name TEXT,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_print_files_order_id ON print_files(order_id);
CREATE INDEX IF NOT EXISTS idx_print_files_event_id ON print_files(event_id);
CREATE INDEX IF NOT EXISTS idx_print_files_exhibitor_id ON print_files(exhibitor_id);

ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert to print_files" ON print_files;
DROP POLICY IF EXISTS "Allow public read access to print_files" ON print_files;
DROP POLICY IF EXISTS "Allow public update to print_files" ON print_files;
DROP POLICY IF EXISTS "Allow public delete from print_files" ON print_files;
CREATE POLICY "Allow public insert to print_files" ON print_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access to print_files" ON print_files FOR SELECT USING (true);
CREATE POLICY "Allow public update to print_files" ON print_files FOR UPDATE USING (true);
CREATE POLICY "Allow public delete from print_files" ON print_files FOR DELETE USING (true);

-- ============ SKAPA STORAGE BUCKET ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('print-files', 'print-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public upload to print-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from print-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from print-files" ON storage.objects;
CREATE POLICY "Allow public upload to print-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'print-files');
CREATE POLICY "Allow public read from print-files" ON storage.objects FOR SELECT USING (bucket_id = 'print-files');
CREATE POLICY "Allow public delete from print-files" ON storage.objects FOR DELETE USING (bucket_id = 'print-files');

-- ============ VERIFIERA ============
SELECT 'events' as tabell, count(*) FROM events
UNION ALL SELECT 'exhibitors', count(*) FROM exhibitors
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'print_files', count(*) FROM print_files;

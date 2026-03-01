-- Create events table
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

-- Create exhibitors table
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

-- Create orders table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exhibitors_event_id ON exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_email ON exhibitors(email);
CREATE INDEX IF NOT EXISTS idx_orders_exhibitor_id ON orders(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (we'll refine this later with auth)
CREATE POLICY "Allow public read access to events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to events"
  ON events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to events"
  ON events FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to exhibitors"
  ON exhibitors FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to exhibitors"
  ON exhibitors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to exhibitors"
  ON exhibitors FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access to orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to orders"
  ON orders FOR UPDATE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

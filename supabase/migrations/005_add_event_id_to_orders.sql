-- Migration 005: Lägg till event_id på orders-tabellen
-- Detta kopplar beställningar till specifika events

ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Index för snabbare sökning per event
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);

-- RLS policy för event-kopplade orders
DROP POLICY IF EXISTS "Allow public insert to orders" ON orders;
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
CREATE POLICY "Allow public read access to orders" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update to orders" ON orders;
CREATE POLICY "Allow public update to orders" ON orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete from orders" ON orders;
CREATE POLICY "Allow public delete from orders" ON orders FOR DELETE USING (true);

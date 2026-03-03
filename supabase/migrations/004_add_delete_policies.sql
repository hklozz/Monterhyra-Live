-- Add DELETE policies for all tables
-- This allows public delete access (you can refine this later with proper auth)

CREATE POLICY "Allow public delete from events"
  ON events FOR DELETE
  USING (true);

CREATE POLICY "Allow public delete from exhibitors"
  ON exhibitors FOR DELETE
  USING (true);

CREATE POLICY "Allow public delete from orders"
  ON orders FOR DELETE
  USING (true);

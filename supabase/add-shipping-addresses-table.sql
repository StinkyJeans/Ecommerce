CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Philippines',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_username ON shipping_addresses(username);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON shipping_addresses(username, is_default);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own addresses" ON shipping_addresses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own addresses" ON shipping_addresses
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own addresses" ON shipping_addresses
  FOR DELETE USING (true);

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

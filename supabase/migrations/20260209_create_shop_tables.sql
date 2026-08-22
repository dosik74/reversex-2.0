-- ============================================================================
-- SHOP TABLES SCHEMA
-- ============================================================================

-- 1. Shop Products Table
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  video_url TEXT,
  specs JSONB,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Shop Orders Table
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  total_price DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, delivered, cancelled
  payment_method TEXT, -- kaspi_installment, kaspi_red, credit
  delivery_address TEXT,
  items JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. Admin Events Table (for tracking calls and messages)
CREATE TABLE IF NOT EXISTS admin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'phone_call', 'whatsapp_message'
  phone_number TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  last_contact TIMESTAMP DEFAULT now(),
  details JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. PC Build Configurations Table
CREATE TABLE IF NOT EXISTS pc_builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  total_price DECIMAL(12, 2),
  components JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_shop_orders_user_id ON shop_orders(user_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_admin_events_type ON admin_events(type);
CREATE INDEX idx_admin_events_phone ON admin_events(phone_number);
CREATE INDEX idx_pc_builds_user_id ON pc_builds(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_builds ENABLE ROW LEVEL SECURITY;

-- Products: public read
CREATE POLICY "Anyone can view products" ON shop_products
  FOR SELECT USING (true);

-- Orders: users can view own orders, admin can view all
CREATE POLICY "Users can view own orders" ON shop_orders
  FOR SELECT USING (auth.uid() = user_id OR current_setting('role') = 'admin');

-- Orders: authenticated users can create
CREATE POLICY "Users can create orders" ON shop_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin events: admin only
CREATE POLICY "Admin only access" ON admin_events
  FOR SELECT USING (current_setting('role') = 'admin');

-- PC Builds: users can manage own
CREATE POLICY "Users can view own builds" ON pc_builds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create builds" ON pc_builds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert featured product
INSERT INTO shop_products (name, description, price, specs, in_stock)
VALUES (
  'Мощный игровой ПК RX 580',
  'Высокопроизводительный ПК для игр и работы',
  150000,
  '{"gpu": "RX 580 8GB", "cpu": "Xeon E5-2670v2", "platform": "X79", "ram": "16GB DDR3", "psu": "500W PC Cooler 80+"}',
  true
);

-- Insert components
INSERT INTO shop_products (name, price, specs, in_stock)
VALUES 
  ('RX 580 8GB', 35000, '{"type": "GPU"}', true),
  ('Xeon E5-2670v2', 25000, '{"type": "CPU", "cores": 12, "threads": 24}', true),
  ('16GB DDR3 RAM', 18000, '{"type": "RAM", "speed": "1600MHz"}', true),
  ('500W PSU PC Cooler 80+', 12000, '{"type": "PSU"}', true);

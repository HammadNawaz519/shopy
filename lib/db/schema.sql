-- ============================================================================
-- SHOPY ATELIER — SUPABASE POSTGRESQL PRODUCTION RELATIONAL SCHEMA & MIGRATION
-- ============================================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  tagline TEXT,
  image TEXT NOT NULL,
  description TEXT,
  aspect_ratio VARCHAR(20) DEFAULT 'tall',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
  category_slug VARCHAR(100) NOT NULL,
  category_label VARCHAR(100) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  description TEXT NOT NULL,
  tag VARCHAR(50) DEFAULT 'NEW',
  images TEXT[] NOT NULL DEFAULT '{}',
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  composition TEXT[] DEFAULT '{}',
  care_instructions TEXT[] DEFAULT '{}',
  details TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS / CLIENTS TABLE
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reset_token VARCHAR(100),
  reset_token_expiry BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  subtotal NUMERIC(12, 2) NOT NULL,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'card')),
  shipping_address JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ITEMS (RELATIONAL LINE ITEMS WITH PRODUCT PRICE SNAPSHOTS)
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  size VARCHAR(50),
  color VARCHAR(50),
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DISCOUNTS / PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS discounts (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(12, 2) NOT NULL,
  min_order NUMERIC(12, 2) DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STORE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS store_settings (
  id VARCHAR(50) PRIMARY KEY,
  store_name VARCHAR(150) NOT NULL DEFAULT 'SHOPY Atelier',
  support_email VARCHAR(255) NOT NULL DEFAULT 'concierge@shopy.com',
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT 'Rs.',
  free_shipping_threshold NUMERIC(12, 2) DEFAULT 15000,
  flat_shipping_rate NUMERIC(12, 2) DEFAULT 500,
  tax_percentage NUMERIC(5, 2) DEFAULT 0,
  order_notifications BOOLEAN DEFAULT true,
  inventory_alert_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email VARCHAR(255) PRIMARY KEY,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(UPPER(code));

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Categories
INSERT INTO categories (id, slug, name, tagline, image, description, aspect_ratio, featured)
VALUES 
  ('cat-1', 'tops', 'TOPS', 'Tailored Shirts, Heavyweight Tees & Knitwear', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200', 'Architectural silhouettes crafted in heavyweight organic cotton, breathable linen, and Italian merino wool.', 'tall', true),
  ('cat-2', 'bottoms', 'BOTTOMS', 'Pleated Trousers, Cargo Pants & Denim', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=1200', 'Relaxed drape, high-rise cuts, and precision-tailored pleated trousers designed for fluid motion.', 'tall', true),
  ('cat-3', 'footwear', 'FOOTWEAR', 'Minimalist Leather Loafers & Sculptural Boots', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200', 'Handcrafted calfskin leather footwear bridging timeless craftsmanship with contemporary proportions.', 'square', true),
  ('cat-4', 'fragrances', 'FRAGRANCES', 'Artisanal Extraits de Parfum', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200', 'High-concentration extraits de parfum exploring deep woods, incense, rare ambers, and smoky florals.', 'tall', true),
  ('cat-5', 'co-ord-sets', 'CO-ORD SETS', 'Monochrome Uniforms & Layering Ensembles', 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=1200', 'Harmonized matching two-piece silhouettes engineered for effortless everyday luxury.', 'tall', true),
  ('cat-6', 'accessories', 'ACCESSORIES', 'Leather Goods, Silk Scarves & Jewelry', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200', 'Subtle sculptural accents designed to complete the modern wardrobe with refined presence.', 'square', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  image = EXCLUDED.image,
  description = EXCLUDED.description;

-- Products
INSERT INTO products (id, name, slug, category_id, category_slug, category_label, price, original_price, description, tag, images, colors, sizes, composition, care_instructions, details, featured, in_stock, stock_count)
VALUES
  ('prod-1', 'Architectural Boxy Heavyweight Tee', 'architectural-boxy-heavyweight-tee', 'cat-1', 'tops', 'Tops', 8500, 10500, 'Constructed from 280 GSM custom-milled organic French terry cotton. Features dropped shoulders, an oversized silhouette, and a structured mock-rib collar.', 'NEW', 
   ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1200', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1200'], 
   '[{"name": "Raw Ecru", "hex": "#F4F4F2"}, {"name": "Obsidian Slate", "hex": "#495464"}, {"name": "Muted Bone", "hex": "#E8E8E8"}]'::jsonb, 
   ARRAY['XS', 'S', 'M', 'L', 'XL'], 
   ARRAY['100% Organic Heavyweight Cotton', 'Pre-shrunk 280 GSM fabric'], 
   ARRAY['Machine wash cold inside out', 'Hang dry in shade', 'Iron low heat'], 
   ARRAY['Signature drop shoulder fit', 'Reinforced twin-needle stitching', 'Fabric washed for ultra-soft hand feel', 'Made in Lahore atelier'], 
   true, true, 24),

  ('prod-2', 'Pleated Fluid Wool Trousers', 'pleated-fluid-wool-trousers', 'cat-2', 'bottoms', 'Bottoms', 16500, 19000, 'Tailored with deep double-forward pleats, a wide relaxed leg, and an adjustable side tab waistband. Woven from breathable tropical wool.', 'SALE', 
   ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=1200', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1200'], 
   '[{"name": "Slate Grey", "hex": "#495464"}, {"name": "Muted Ash", "hex": "#BBBFCA"}]'::jsonb, 
   ARRAY['28', '30', '32', '34', '36'], 
   ARRAY['100% Tropical Virgin Wool', 'Bemberg cupro lining'], 
   ARRAY['Dry clean only', 'Steam press'], 
   ARRAY['Double forward pleats', 'Internal horn buttons', 'Blind hem finish'], 
   true, true, 18),

  ('prod-3', 'Silk-Modal Heavyweight Track Jacket', 'silk-modal-heavyweight-track-jacket', 'cat-5', 'co-ord-sets', 'Co-Ord Sets', 18500, 22000, 'Minimalist luxury tracksuit jacket with high funnel neck, silver two-way Raccagni zipper, and hidden seam pockets.', 'LIMITED', 
   ARRAY['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=1200'], 
   '[{"name": "Muted Bone", "hex": "#E8E8E8"}, {"name": "Obsidian Slate", "hex": "#495464"}]'::jsonb, 
   ARRAY['S', 'M', 'L', 'XL'], 
   ARRAY['70% Modal, 25% Organic Cotton, 5% Silk'], 
   ARRAY['Gentle machine wash cold', 'Lay flat to dry'], 
   ARRAY['Two-way metal zipper', 'Ribbed cuffs and hem'], 
   true, true, 12),

  ('prod-4', 'Sculptural Calfskin Penny Loafer', 'sculptural-calfskin-penny-loafer', 'cat-3', 'footwear', 'Footwear', 28000, NULL, 'Handcrafted from Italian full-grain box calf leather with a squared sculptural toe and Goodyear welted leather sole.', 'NEW', 
   ARRAY['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200'], 
   '[{"name": "Obsidian Black", "hex": "#1B1B1B"}, {"name": "Deep Cognac", "hex": "#4A2E18"}]'::jsonb, 
   ARRAY['40', '41', '42', '43', '44', '45'], 
   ARRAY['100% Full-grain Italian Calfskin', 'Hand-stitched leather sole'], 
   ARRAY['Condition with leather balm', 'Store with cedar shoe trees'], 
   ARRAY['Goodyear welted construction', 'Sculptural square-round toe'], 
   true, true, 10),

  ('prod-5', 'Bois d''Encens Extrait de Parfum 50ml', 'bois-d-encens-extrait-de-parfum-50ml', 'cat-4', 'fragrances', 'Fragrances', 22000, NULL, '30% concentration extrait de parfum. Top notes of Somalian frankincense, heart of Atlas cedarwood, and base of dark ambergris and smoked birch.', 'ARCHIVE', 
   ARRAY['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200'], 
   '[{"name": "Obsidian Glass", "hex": "#495464"}]'::jsonb, 
   ARRAY['50ml'], 
   ARRAY['Pure Extrait de Parfum (30% Concentration)', 'Organic sugarcane alcohol base'], 
   ARRAY['Store away from direct sunlight in cool climate'], 
   ARRAY['Hand-poured into heavyweight frosted glass bottle', 'Magnetic metallic cap'], 
   true, true, 25),

  ('prod-6', 'Raw Linen Dropped Shoulder Overshirt', 'raw-linen-dropped-shoulder-overshirt', 'cat-1', 'tops', 'Tops', 14000, 16500, 'Crafted from heavy 320 GSM unbleached Belgian linen. Unstructured relaxed silhouette with concealed placket.', 'NEW', 
   ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200'], 
   '[{"name": "Natural Ecru", "hex": "#F4F4F2"}, {"name": "Slate Blue", "hex": "#495464"}]'::jsonb, 
   ARRAY['S', 'M', 'L', 'XL'], 
   ARRAY['100% Unbleached Heavyweight Belgian Linen'], 
   ARRAY['Hand wash cold or gentle dry clean'], 
   ARRAY['Natural mother-of-pearl buttons', 'Curved hemline'], 
   true, true, 16)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock_count = EXCLUDED.stock_count,
  description = EXCLUDED.description;

-- Users (Super Admin + Demo Customer)
INSERT INTO users (id, name, email, password_hash, role)
VALUES
  ('usr_admin_master', 'Hammad Nawaz', 'hammadnawaz276@gmail.com', '$2a$10$tZ8Q7R6s5wUq3h3hC6.YjeBvD8uM2gS7D3O1eO1yR2d1aW2c3e4f5', 'admin'),
  ('usr_demo_customer', 'Ayaan Malik', 'demo@shopy.com', '$2a$10$w0vHnF3l1Jt7p4YvV1s3a.K1yG6t4q7a8s9d0f1g2h3j4k5l6z7x8', 'user')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

-- Discounts
INSERT INTO discounts (id, code, type, value, min_order, usage_count, active)
VALUES
  ('dsc_1', 'SHOPY10', 'percentage', 10, 5000, 14, true),
  ('dsc_2', 'EDITORIAL15', 'percentage', 15, 15000, 8, true),
  ('dsc_3', 'WELCOME500', 'fixed', 500, 8000, 22, true)
ON CONFLICT (id) DO NOTHING;

-- Store Settings
INSERT INTO store_settings (id, store_name, support_email, currency, currency_symbol, free_shipping_threshold, flat_shipping_rate, tax_percentage, order_notifications, inventory_alert_threshold)
VALUES
  ('settings_default', 'SHOPY Atelier', 'concierge@shopy.com', 'PKR', 'Rs.', 15000, 500, 0, true, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- THREE VERIFIED RELATIONAL ORDERS (REQUIREMENT: PENDING, PROCESSING, DELIVERED)
-- ============================================================================

-- Order 1: PENDING Status
INSERT INTO orders (id, order_number, user_id, subtotal, discount, shipping, total, status, payment_status, payment_method, shipping_address)
VALUES (
  'ord_real_101', 
  'SHP-2026-1011', 
  'usr_demo_customer', 
  17000, 
  0, 
  0, 
  17000, 
  'PENDING', 
  'PENDING', 
  'cod', 
  '{"firstName": "Ayaan", "lastName": "Malik", "email": "demo@shopy.com", "phone": "0300 1234567", "address": "House 14, Street 9, Sector F-7/2", "city": "Islamabad", "postalCode": "44000", "province": "Federal"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color, image)
VALUES (
  'item_101_1', 
  'ord_real_101', 
  'prod-1', 
  'Architectural Boxy Heavyweight Tee', 
  8500, 
  2, 
  'L', 
  'Obsidian Slate', 
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600'
)
ON CONFLICT (id) DO NOTHING;

-- Order 2: PROCESSING Status
INSERT INTO orders (id, order_number, user_id, subtotal, discount, shipping, total, status, payment_status, payment_method, shipping_address)
VALUES (
  'ord_real_102', 
  'SHP-2026-1022', 
  'usr_demo_customer', 
  40500, 
  0, 
  0, 
  40500, 
  'PROCESSING', 
  'PAID', 
  'card', 
  '{"firstName": "Bilal", "lastName": "Khan", "email": "bilal.khan@gmail.com", "phone": "0321 9876543", "address": "Apartment 4B, Signature Tower, Clifton", "city": "Karachi", "postalCode": "75600", "province": "Sindh"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color, image)
VALUES 
  ('item_102_1', 'ord_real_102', 'prod-3', 'Silk-Modal Heavyweight Track Jacket', 18500, 1, 'M', 'Muted Bone', 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&q=80&w=600'),
  ('item_102_2', 'ord_real_102', 'prod-5', 'Bois d''Encens Extrait de Parfum 50ml', 22000, 1, '50ml', 'Obsidian Glass', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600')
ON CONFLICT (id) DO NOTHING;

-- Order 3: DELIVERED Status
INSERT INTO orders (id, order_number, user_id, subtotal, discount, shipping, total, status, payment_status, payment_method, shipping_address)
VALUES (
  'ord_real_103', 
  'SHP-2026-1033', 
  'usr_demo_customer', 
  28000, 
  2800, 
  0, 
  25200, 
  'DELIVERED', 
  'PAID', 
  'card', 
  '{"firstName": "Zain", "lastName": "Ahmed", "email": "zain.ahmed@gmail.com", "phone": "0333 5551234", "address": "Villa 12, Phase 5, DHA", "city": "Lahore", "postalCode": "54000", "province": "Punjab"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color, image)
VALUES (
  'item_103_1', 
  'ord_real_103', 
  'prod-4', 
  'Sculptural Calfskin Penny Loafer', 
  28000, 
  1, 
  '42', 
  'Obsidian Black', 
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600'
)
ON CONFLICT (id) DO NOTHING;

-- Initial Reviews
INSERT INTO reviews (id, product_id, product_name, customer_name, customer_email, rating, comment, status)
VALUES
  ('rev_1', 'prod-1', 'Architectural Boxy Heavyweight Tee', 'Ayaan Malik', 'ayaan@gmail.com', 5, 'The drape and weight of the 280 GSM cotton is phenomenal. Best tee I own.', 'approved'),
  ('rev_2', 'prod-5', 'Bois d''Encens Extrait de Parfum', 'Hamza Tariq', 'hamza@gmail.com', 5, 'Incredible sillage and longevity. Rich smoky cedar and incense notes.', 'approved')
ON CONFLICT (id) DO NOTHING;

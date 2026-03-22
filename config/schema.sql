-- ============================================
-- MATCHA STORE - Database Schema (PostgreSQL)
-- Compatible with Supabase free tier
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: categories
-- ============================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(10),
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  stock INT DEFAULT 0,
  weight INT DEFAULT 100, -- in grams
  image_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_province VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(10) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  shipping_cost DECIMAL(12,2) DEFAULT 10000,
  total DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'transfer',
  payment_bank VARCHAR(50),
  status VARCHAR(30) DEFAULT 'pending' CHECK (
    status IN ('pending','paid','processing','shipped','delivered','cancelled')
  ),
  notes TEXT,
  whatsapp_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,
  product_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO categories (name, slug, description) VALUES
('Matcha', 'matcha', 'Teh hijau matcha premium dari berbagai grade'),
('Teh Herbal', 'teh-herbal', 'Ramuan herbal pilihan untuk kesehatan'),
('Teh Campuran', 'teh-campuran', 'Campuran matcha dan herbal pilihan');

-- ============================================
-- SEED DATA: Admin User (password: admin123)
-- Hash bcrypt dari "admin123"
-- ============================================
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin Matcha', 'admin@matchastore.id', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '085651346443');

-- ============================================
-- SEED DATA: Products
-- ============================================
INSERT INTO products (category_id, name, slug, description, price, stock, weight, image_url, is_featured) VALUES
(1, 'Matcha Premium Grade A', 'matcha-premium-grade-a',
 'Matcha grade A dengan warna hijau cerah dan rasa umami yang kaya. Cocok untuk diminum langsung atau campuran minuman. Dipanen dari kebun teh terbaik. Kaya antioksidan dan L-theanine untuk fokus dan relaksasi.',
 85000, 50, 100,
 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400', true),

(1, 'Matcha Culinary Grade', 'matcha-culinary-grade',
 'Matcha culinary grade ideal untuk baking, minuman, dan masakan. Warna hijau alami yang pekat, cocok untuk kue, latte, dan smoothie. Harga terjangkau dengan kualitas terjamin.',
 45000, 80, 100,
 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', false),

(1, 'Matcha Ceremonial Grade', 'matcha-ceremonial-grade',
 'Matcha tertinggi untuk upacara teh tradisional Jepang. Dipetik tangan dari daun teh termuda, tekstur halus seperti sutra, rasa manis alami tanpa pahit. Pengalaman teh yang sesungguhnya.',
 145000, 20, 30,
 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400', true),

(2, 'Jahe Merah Organik', 'jahe-merah-organik',
 'Jahe merah organik tanpa pestisida, diproses higienis. Kaya gingerol untuk menghangatkan tubuh, melancarkan sirkulasi darah, dan meningkatkan imun. Cocok untuk minuman hangat sehari-hari.',
 35000, 100, 200,
 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400', true),

(2, 'Chamomile Premium', 'chamomile-premium',
 'Bunga chamomile kering premium, dipilih dari biji terbaik. Aroma floral yang menenangkan, membantu relaksasi, mengurangi kecemasan, dan meningkatkan kualitas tidur. Bebas kafein.',
 55000, 60, 50,
 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400', false),

(2, 'Teh Peppermint', 'teh-peppermint',
 'Daun peppermint segar yang dikeringkan dengan metode freeze-dry untuk menjaga kandungan mentol alami. Menyegarkan, membantu pencernaan, dan mengurangi mual. Bebas kafein.',
 42000, 75, 50,
 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400', false),

(3, 'Matcha Jahe Fusion', 'matcha-jahe-fusion',
 'Perpaduan sempurna matcha premium dan jahe merah organik. Kombinasi unik antara earthy matcha dan kehangatan jahe. Meningkatkan energi sekaligus menghangatkan tubuh. Best seller kami!',
 65000, 40, 100,
 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', true),

(3, 'Relaxing Blend', 'relaxing-blend',
 'Campuran chamomile, lemon balm, dan lavender untuk relaksasi sempurna. Formula khusus untuk membantu tidur lebih nyenyak dan mengurangi stres. Tanpa kafein, aman diminum malam hari.',
 72000, 35, 80,
 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400', false);

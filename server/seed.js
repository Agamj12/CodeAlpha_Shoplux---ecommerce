const { initDB, getDB } = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  initDB();
  const db = getDB();

  console.log('🌱 Seeding database...');

  // Categories
  const categories = [
    { name: 'Electronics', description: 'Gadgets and electronic devices', icon: '💻' },
    { name: 'Clothing', description: 'Fashion and apparel', icon: '👕' },
    { name: 'Home & Garden', description: 'Home decor and gardening', icon: '🏡' },
    { name: 'Sports', description: 'Sports equipment and gear', icon: '⚽' },
    { name: 'Books', description: 'Books and educational materials', icon: '📚' },
    { name: 'Beauty', description: 'Beauty and personal care', icon: '💄' },
  ];

  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)');
  categories.forEach(c => insertCategory.run(c.name, c.description, c.icon));

  const cats = {};
  db.prepare('SELECT * FROM categories').all().forEach(c => { cats[c.name] = c.id; });

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)').run(
    'Admin User', 'admin@shop.com', adminPassword, 'admin', '#6C63FF'
  );

  // Sample user
  const userPassword = await bcrypt.hash('user123', 10);
  db.prepare('INSERT OR IGNORE INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)').run(
    'John Doe', 'john@example.com', userPassword, 'customer', '#FF6584'
  );

  // Products
  const products = [
    { name: 'MacBook Pro 14"', description: 'Powerful laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers and creatives.', price: 167999, original_price: 193199,
      category: 'Electronics', stock: 15, featured: 1,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80'
    },
    { name: 'Sony WH-1000XM5', description: 'Industry-leading noise canceling headphones with 30-hour battery life and crystal clear audio.', price: 29399, original_price: 33599,
      category: 'Electronics', stock: 30, featured: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
    },
    { name: 'iPhone 15 Pro', description: 'Latest iPhone with titanium design, 48MP camera system, and A17 Pro chip.', price: 92399, original_price: null,
      category: 'Electronics', stock: 20, featured: 1,
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80'
    },
    { name: 'Samsung 4K Smart TV 55"', description: '55-inch 4K QLED display with smart TV features, HDR10+, and built-in Alexa.', price: 67199, original_price: 83999,
      category: 'Electronics', stock: 8, featured: 0,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80'
    },
    { name: 'Nike Air Max 270', description: 'Premium running shoes with Air Max cushioning. Available in multiple colors.', price: 10919, original_price: 12599,
      category: 'Clothing', stock: 50, featured: 1,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    },
    { name: "Levi's 501 Jeans", description: 'Classic straight fit jeans in premium denim. Timeless style that never goes out of fashion.', price: 5879, original_price: null,
      category: 'Clothing', stock: 80, featured: 0,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80'
    },
    { name: 'Adidas Ultraboost 22', description: 'High-performance running shoes with responsive Boost midsole and Primeknit+ upper.', price: 15119, original_price: 16799,
      category: 'Clothing', stock: 35, featured: 0,
      image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80'
    },
    { name: 'Dyson V15 Detect', description: 'Cordless vacuum with laser dust detection and 60-minute battery life. The most powerful Dyson ever.', price: 54599, original_price: 62999,
      category: 'Home & Garden', stock: 12, featured: 1,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80'
    },
    { name: 'Instant Pot Duo 7-in-1', description: 'Multi-use pressure cooker, slow cooker, rice cooker, steamer, sauté pan, and more.', price: 6719, original_price: 8399,
      category: 'Home & Garden', stock: 25, featured: 0,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80'
    },
    { name: 'Yoga Mat Premium', description: 'Non-slip eco-friendly yoga mat, 6mm thick with alignment lines. Perfect for all yoga styles.', price: 4199, original_price: null,
      category: 'Sports', stock: 45, featured: 0,
      image: 'https://images.unsplash.com/photo-1601925228096-eae0dd1eb405?w=500&q=80'
    },
    { name: 'Wilson Pro Staff Tennis Racket', description: 'Professional tennis racket used by Roger Federer. Perfect control and precision.', price: 20999, original_price: 25199,
      category: 'Sports', stock: 18, featured: 0,
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500&q=80'
    },
    { name: 'Atomic Habits', description: 'By James Clear. The definitive guide on how to build good habits and break bad ones.', price: 1259, original_price: 1679,
      category: 'Books', stock: 100, featured: 1,
      image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500&q=80'
    },
    { name: 'The Pragmatic Programmer', description: 'Your journey to mastery. Essential reading for every software developer.', price: 3779, original_price: null,
      category: 'Books', stock: 60, featured: 0,
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80'
    },
    { name: 'Charlotte Tilbury Palette', description: 'Luxury eyeshadow palette with 8 neutral shades. Buildable, blendable, and long-lasting.', price: 5460, original_price: null,
      category: 'Beauty', stock: 22, featured: 0,
      image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&q=80'
    },
    { name: 'Apple Watch Series 9', description: 'Advanced health sensors, crash detection, and 18-hour battery. Your health companion.', price: 33599, original_price: 36119,
      category: 'Electronics', stock: 25, featured: 1,
      image: 'https://images.unsplash.com/photo-1434493907317-a46b5bbe7834?w=500&q=80'
    },
    { name: 'AirPods Pro 2nd Gen', description: 'Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio.', price: 20999, original_price: null,
      category: 'Electronics', stock: 40, featured: 0,
      image: 'https://images.unsplash.com/photo-1600294037592-7f501b2e9a4c?w=500&q=80'
    },
  ];

  const insertProduct = db.prepare(
    'INSERT OR IGNORE INTO products (name, description, price, original_price, category_id, stock, image, featured, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const ratings = [4.5, 4.8, 4.7, 4.3, 4.6, 4.2, 4.4, 4.9, 4.1, 4.7, 4.5, 4.8, 4.6, 4.3, 4.7, 4.5];
  const reviewCounts = [128, 342, 512, 89, 234, 156, 98, 67, 145, 78, 43, 891, 234, 112, 445, 267];

  products.forEach((p, i) => {
    insertProduct.run(p.name, p.description, p.price, p.original_price || null, cats[p.category], p.stock, p.image, p.featured, ratings[i] || 4.5, reviewCounts[i] || 50);
  });

  // Sample orders
  const productIds = db.prepare('SELECT id FROM products LIMIT 4').all().map(p => p.id);
  const userId = db.prepare("SELECT id FROM users WHERE email = 'john@example.com'").get().id;

  if (productIds.length >= 2) {
    const orderResult = db.prepare(
      "INSERT OR IGNORE INTO orders (user_id, total, status, shipping_address, payment_method) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, 349.98, 'delivered', JSON.stringify({ street: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'USA' }), 'card');

    if (orderResult.lastInsertRowid) {
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(orderResult.lastInsertRowid, productIds[0], 1, 199.99);
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)').run(orderResult.lastInsertRowid, productIds[1], 1, 149.99);
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@shop.com / admin123');
  console.log('📧 User:  john@example.com / user123');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seed };

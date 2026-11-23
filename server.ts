import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const ADMIN_EMAIL = (
  process.env.VITE_ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  'admin@kaverisilks.in'
).toLowerCase();

const DATA_DIR = path.resolve(process.cwd(), '.data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'db.json');

interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  created_at: string;
}

interface StoredProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  saved_address: string;
  city: string;
  pincode: string;
  created_at: string;
}

interface StoredProduct {
  id: string;
  name: string;
  description: string;
  category: 'Bridal Silks' | 'Designer Kurtis' | 'Aari Blouses' | 'Lehengas';
  price: number;
  sizes: string[];
  image_url: string;
  in_stock: boolean;
  created_at: string;
}

interface StoredOrder {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  pincode: string;
  items: Array<{
    product_id: string;
    name: string;
    category: string;
    price: number;
    size: string;
    quantity: number;
    image_url: string;
  }>;
  total_amount: number;
  payment_method: 'UPI' | 'COD';
  upi_transaction_id: string | null;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';
  created_at: string;
}

interface StoredReview {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface StoredWatchlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  profiles: StoredProfile[];
  products: StoredProduct[];
  orders: StoredOrder[];
  reviews: StoredReview[];
  watchlist: StoredWatchlistItem[];
  sessions: Record<string, string>; // token -> userId
}

const INITIAL_PRODUCTS: StoredProduct[] = [
  {
    id: 'prod-kanchi-korvai-01',
    name: 'Kanchipuram Korvai Maroon Bridal Silk',
    description:
      'Pure 3-ply mulberry silk woven on traditional pit looms in Kanchipuram with pure silver-dipped antique gold zari peacock and rudraksham borders.',
    category: 'Bridal Silks',
    price: 38500,
    sizes: ['Free Size'],
    image_url: '/src/assets/images/product_bridal_kanchipuram_1795447517259.jpg',
    in_stock: true,
    created_at: '2026-11-10T09:00:00.000Z',
  },
  {
    id: 'prod-muhurtham-ivory-02',
    name: 'Swarna Ivory Tissue Muhurtham Saree',
    description:
      'Luminous warm ivory silk interwoven with fine gold tissue weft, finished with hand-knotted kuchu silk tassels along the ceremonial pallu.',
    category: 'Bridal Silks',
    price: 44000,
    sizes: ['Free Size'],
    image_url: '/src/assets/images/product_ivory_muhurtham_1795447517063.jpg',
    in_stock: true,
    created_at: '2026-11-11T09:00:00.000Z',
  },
  {
    id: 'prod-aari-kasu-03',
    name: 'Lakshmi Kasu Hand-Aari Bridal Blouse',
    description:
      'Tailored deep temple maroon raw silk blouse featuring bespoke Maggam Aari zardosi embroidery, temple coin kasu detailing, and freshwater pearl edging.',
    category: 'Aari Blouses',
    price: 12800,
    sizes: ['S', 'M', 'L', 'XL'],
    image_url: '/src/assets/images/product_aari_blouse_1795447517305.jpg',
    in_stock: true,
    created_at: '2026-11-12T09:00:00.000Z',
  },
  {
    id: 'prod-chanderi-kurti-04',
    name: 'Chandrika Ivory Chanderi Zari Kurti Set',
    description:
      'Breathable handwoven ivory Chanderi silk kurti detailed with antique gold paisley motifs and potli buttons, paired with an organza zari dupatta.',
    category: 'Designer Kurtis',
    price: 9400,
    sizes: ['S', 'M', 'L', 'XL'],
    image_url: '/src/assets/images/product_designer_kurti_1795447516827.jpg',
    in_stock: true,
    created_at: '2026-11-13T09:00:00.000Z',
  },
  {
    id: 'prod-banarasi-kurti-05',
    name: 'Madurai Crimson Silk Brocade Ensemble',
    description:
      'Rich burgundy silk-brocade festive kurti with finely woven gold floral jaal work and a matching scalloped zari dupatta.',
    category: 'Designer Kurtis',
    price: 11200,
    sizes: ['S', 'M', 'L', 'XL'],
    image_url: '/src/assets/images/product_festive_anarkali_1795447517646.jpg',
    in_stock: true,
    created_at: '2026-11-14T09:00:00.000Z',
  },
  {
    id: 'prod-royal-lehenga-06',
    name: 'Thanjavur Temple Zari Bridal Lehenga',
    description:
      'Structured heirloom Kanchipuram brocade lehenga in temple maroon and antique gold, paired with a hand-embroidered blouse and scalloped organza dupatta.',
    category: 'Lehengas',
    price: 54500,
    sizes: ['S', 'M', 'L', 'Free Size'],
    image_url: '/src/assets/images/product_silk_lehenga_1795447517771.jpg',
    in_stock: true,
    created_at: '2026-11-15T09:00:00.000Z',
  },
];

function ensureDataDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function loadDb(): DatabaseSchema {
  ensureDataDirs();
  if (!fs.existsSync(DB_PATH)) {
    const initial: DatabaseSchema = {
      users: [],
      profiles: [],
      products: INITIAL_PRODUCTS,
      orders: [],
      reviews: [],
      watchlist: [],
      sessions: {},
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as DatabaseSchema;
  parsed.reviews = parsed.reviews || [];
  parsed.watchlist = parsed.watchlist || [];
  return parsed;
}

function saveDb(db: DatabaseSchema) {
  ensureDataDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash };
}

function getUserFromRequest(req: express.Request, db: DatabaseSchema): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const userId = db.sessions[token];
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

async function startServer() {
  ensureDataDirs();
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Auth: Sign Up
  app.post('/api/auth/signup', (req, res) => {
    const { full_name, email, phone, password } = req.body as {
      full_name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!full_name?.trim() || !email?.trim() || !phone?.trim() || !password || password.length < 6) {
      res.status(400).json({ error: 'Please provide full name, valid email, phone, and password (min 6 characters).' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadDb();

    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    const userId = crypto.randomUUID();
    const { salt, hash } = hashPassword(password);
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id: userId,
      email: normalizedEmail,
      password_hash: hash,
      salt,
      created_at: now,
    };

    const newProfile: StoredProfile = {
      id: userId,
      full_name: full_name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      saved_address: '',
      city: '',
      pincode: '',
      created_at: now,
    };

    const token = crypto.randomBytes(32).toString('hex');
    db.users.push(newUser);
    db.profiles.push(newProfile);
    db.sessions[token] = userId;
    saveDb(db);

    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email },
      profile: newProfile,
    });
  });

  // Auth: Sign In
  app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const { hash } = hashPassword(password, user.salt);
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.password_hash, 'hex'))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const profile = db.profiles.find((p) => p.id === user.id) || null;
    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);

    res.json({
      token,
      user: { id: user.id, email: user.email },
      profile,
    });
  });

  // Auth: Current Session
  app.get('/api/auth/session', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const profile = db.profiles.find((p) => p.id === user.id) || null;
    res.json({
      user: { id: user.id, email: user.email },
      profile,
    });
  });

  // Auth: Sign Out
  app.post('/api/auth/signout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const db = loadDb();
      delete db.sessions[token];
      saveDb(db);
    }
    res.json({ ok: true });
  });

  // Profiles: Update own saved address
  app.patch('/api/profiles/me', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const profile = db.profiles.find((p) => p.id === user.id);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const { full_name, phone, saved_address, city, pincode } = req.body as Partial<StoredProfile>;
    if (typeof full_name === 'string' && full_name.trim()) profile.full_name = full_name.trim();
    if (typeof phone === 'string' && phone.trim()) profile.phone = phone.trim();
    if (typeof saved_address === 'string') profile.saved_address = saved_address.trim();
    if (typeof city === 'string') profile.city = city.trim();
    if (typeof pincode === 'string') profile.pincode = pincode.trim();

    saveDb(db);
    res.json(profile);
  });

  // Profiles: Admin list all registered customers
  app.get('/api/profiles', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const profiles = [...db.profiles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(profiles);
  });

  // Products: List all
  app.get('/api/products', (_req, res) => {
    const db = loadDb();
    const products = [...db.products].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    res.json(products);
  });

  // Products: Admin create
  app.post('/api/products', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { name, description, category, price, sizes, image_url, in_stock } = req.body as Partial<StoredProduct>;
    if (!name?.trim() || !description?.trim() || !category || typeof price !== 'number' || !image_url?.trim()) {
      res.status(400).json({ error: 'All product fields including image are required.' });
      return;
    }

    const newProduct: StoredProduct = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category,
      price,
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['Free Size'],
      image_url: image_url.trim(),
      in_stock: typeof in_stock === 'boolean' ? in_stock : true,
      created_at: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    saveDb(db);
    res.status(201).json(newProduct);
  });

  // Products: Admin toggle stock / update
  app.patch('/api/products/:id', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { in_stock, price, name } = req.body as Partial<StoredProduct>;
    if (typeof in_stock === 'boolean') product.in_stock = in_stock;
    if (typeof price === 'number') product.price = price;
    if (typeof name === 'string' && name.trim()) product.name = name.trim();

    saveDb(db);
    res.json(product);
  });

  // Products: Admin delete
  app.delete('/api/products/:id', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    db.products.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
  });

  // Upload: Admin product image upload (base64 data URL -> /uploads/filename)
  app.post('/api/upload', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Valid image file is required.' });
      return;
    }

    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: 'Malformed image payload.' });
      return;
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1].replace(/[^a-z0-9]/gi, '');
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = `${Date.now()}_${(filename || 'item').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}.${ext}`;
    const targetPath = path.join(UPLOAD_DIR, safeName);
    fs.writeFileSync(targetPath, buffer);

    res.status(201).json({ publicUrl: `/uploads/${safeName}` });
  });

  // Orders: List (user's own orders, or all orders for admin)
  app.get('/api/orders', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const isAdminRequest = req.query.scope === 'admin';
    if (isAdminRequest) {
      if (user.email.toLowerCase() !== ADMIN_EMAIL) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }
      const allOrders = [...db.orders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      res.json(allOrders);
      return;
    }

    const myOrders = db.orders
      .filter((o) => o.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(myOrders);
  });

  // Orders: Create new order
  app.post('/api/orders', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Authentication required to place an order.' });
      return;
    }

    const {
      customer_name,
      customer_phone,
      shipping_address,
      city,
      pincode,
      items,
      total_amount,
      payment_method,
      upi_transaction_id,
    } = req.body as Partial<StoredOrder>;

    if (
      !customer_name?.trim() ||
      !customer_phone?.trim() ||
      !shipping_address?.trim() ||
      !city?.trim() ||
      !pincode?.trim() ||
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof total_amount !== 'number' ||
      (payment_method !== 'UPI' && payment_method !== 'COD')
    ) {
      res.status(400).json({ error: 'Please complete all shipping and payment details.' });
      return;
    }

    if (payment_method === 'UPI' && !upi_transaction_id?.trim()) {
      res.status(400).json({ error: 'Please enter your UPI Transaction / UTR Reference ID.' });
      return;
    }

    const newOrder: StoredOrder = {
      id: `KS-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      user_id: user.id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      shipping_address: shipping_address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      items,
      total_amount,
      payment_method,
      upi_transaction_id: payment_method === 'UPI' ? upi_transaction_id?.trim() || null : null,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);

    // Sync saved address back to customer profile
    const profile = db.profiles.find((p) => p.id === user.id);
    if (profile) {
      profile.full_name = customer_name.trim();
      profile.phone = customer_phone.trim();
      profile.saved_address = shipping_address.trim();
      profile.city = city.trim();
      profile.pincode = pincode.trim();
    }

    saveDb(db);
    res.status(201).json(newOrder);
  });

  // Orders: Admin update order status
  app.patch('/api/orders/:id/status', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user || user.email.toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const { status } = req.body as { status?: StoredOrder['status'] };
    if (!status || !['Pending', 'Confirmed', 'Shipped', 'Delivered'].includes(status)) {
      res.status(400).json({ error: 'Invalid order status' });
      return;
    }

    order.status = status;
    saveDb(db);
    res.json(order);
  });

  // Reviews: List reviews for a product
  app.get('/api/products/:id/reviews', (req, res) => {
    const db = loadDb();
    const productReviews = db.reviews
      .filter((r) => r.product_id === req.params.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(productReviews);
  });

  // Reviews: Check whether authenticated user has ordered this product and can review it
  app.get('/api/products/:id/can-review', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.json({ canReview: false, hasReviewed: false });
      return;
    }

    const hasOrdered = db.orders.some(
      (o) =>
        o.user_id === user.id &&
        o.items.some((item) => item.product_id === req.params.id)
    );
    const hasReviewed = db.reviews.some(
      (r) => r.product_id === req.params.id && r.user_id === user.id
    );

    res.json({ canReview: hasOrdered && !hasReviewed, hasReviewed, hasOrdered });
  });

  // Reviews: Submit a verified buyer review
  app.post('/api/products/:id/reviews', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Please sign in to submit a review.' });
      return;
    }

    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const hasOrdered = db.orders.some(
      (o) =>
        o.user_id === user.id &&
        o.items.some((item) => item.product_id === req.params.id)
    );
    if (!hasOrdered) {
      res.status(403).json({
        error: 'Only patrons who have ordered this garment can submit a verified review.',
      });
      return;
    }

    const alreadyReviewed = db.reviews.some(
      (r) => r.product_id === req.params.id && r.user_id === user.id
    );
    if (alreadyReviewed) {
      res.status(409).json({ error: 'You have already reviewed this garment.' });
      return;
    }

    const { rating, comment } = req.body as { rating?: number; comment?: string };
    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Please select a star rating between 1 and 5.' });
      return;
    }
    if (!comment?.trim() || comment.trim().length < 5) {
      res.status(400).json({ error: 'Please share a brief comment (at least 5 characters).' });
      return;
    }

    const profile = db.profiles.find((p) => p.id === user.id);
    const newReview: StoredReview = {
      id: crypto.randomUUID(),
      product_id: req.params.id,
      user_id: user.id,
      reviewer_name: profile?.full_name || user.email.split('@')[0],
      rating: numericRating,
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    db.reviews.unshift(newReview);
    saveDb(db);
    res.status(201).json(newReview);
  });

  // Watchlist: Get authenticated user's watchlisted product IDs
  app.get('/api/watchlist', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const ids = db.watchlist
      .filter((w) => w.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((w) => w.product_id);
    res.json(ids);
  });

  // Watchlist: Add product
  app.post('/api/watchlist', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { product_id } = req.body as { product_id?: string };
    if (!product_id) {
      res.status(400).json({ error: 'product_id is required' });
      return;
    }
    const exists = db.watchlist.some(
      (w) => w.user_id === user.id && w.product_id === product_id
    );
    if (!exists) {
      db.watchlist.unshift({
        id: crypto.randomUUID(),
        user_id: user.id,
        product_id,
        created_at: new Date().toISOString(),
      });
      saveDb(db);
    }
    res.status(201).json({ ok: true });
  });

  // Watchlist: Remove product
  app.delete('/api/watchlist/:productId', (req, res) => {
    const db = loadDb();
    const user = getUserFromRequest(req, db);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    db.watchlist = db.watchlist.filter(
      (w) => !(w.user_id === user.id && w.product_id === req.params.productId)
    );
    saveDb(db);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kaveri Silks boutique server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

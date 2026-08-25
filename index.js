import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-gizli-anahtar-123';

// Güvenlik ve Middleware ayarları
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting (Brute-Force koruması)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // IP başına limit
});
app.use(limiter);

// Veritabanı bağlantısı
let db;
(async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Tabloları oluştur
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      amount REAL,
      type TEXT,
      category TEXT,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
})();

// JWT Doğrulama Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim engellendi: Token bulunamadı' });
  }

  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
};

// --- AUTH ENDPOINTS ---

// Kayıt Ol
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email ve şifre zorunludur' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu', userId: result.lastID });
  } catch (err) {
    res.status(400).json({ error: 'Bu email zaten kayıtlı' });
  }
});

// Giriş Yap
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Hatalı şifre' });
  }

  const token = jwt.encode({ userId: user.id, email: user.email }, JWT_SECRET);
  res.json({ token });
});

// --- TRANSACTIONS ENDPOINTS ---

// Harcama Ekle
app.post('/transactions', authenticateToken, async (req, res) => {
  const { title, amount, type, category, date } = req.body;
  const userId = req.user.userId;

  try {
    const result = await db.run(
      'INSERT INTO transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, amount, type, category, date]
    );
    res.status(201).json({ id: result.lastID, title, amount, type, category, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Korumalı Harcamaları Listeleme (Filtreleme & Sayfalama Destekli)
app.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, category, limit = 10, offset = 0 } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    let params = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = await db.all(query, params);
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 29. Gün: Profil bilgisi getiren endpoint (Çakışma Çözüldü)
app.get('/profile', (req, res) => {
  res.json({ message: "Profil bilgileri ve çakışma çözümü başarılı!" });
});

export default app;
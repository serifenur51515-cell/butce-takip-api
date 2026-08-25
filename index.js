import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json());

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Çok fazla istek gönderildi, lütfen biraz bekleyin.' }
});
app.use('/auth/', limiter);

const PORT = process.env.PORT || 3000;
let db;
const SECRET_KEY = 'GIZLI_KEY_123';

// Veritabanı bağlantısı ve tabloların oluşturulması
(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    // Transactions tablosu
    await db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            amount REAL,
            type TEXT,
            category TEXT,
            note TEXT,
            date TEXT
        )
    `);

    // 21. Gün: Users tablosu (Kullanıcı kaydı için)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('Veritabanı, transactions ve users tabloları başarıyla hazırlandı!');

    // Sunucuyu başlatıyoruz
    app.listen(PORT, () => {
        console.log(`Sunucu http://localhost:${PORT} üzerinde çalışıyor.`);
    });
})();

// 21. Gün: Kullanıcı Kayıt (Register) Endpoint'i
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email ve şifre zorunludur.' });
        }

        // Şifreyi 10 tur salt ile hash'liyoruz
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Kullanıcıyı veritabanına ekliyoruz
        const result = await db.run(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [email, passwordHash]
        );

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu.',
            userId: result.lastID
        });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
        }
        res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
});
// 22. Gün: Kullanıcı Girişi (Login)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
        }

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ error: 'Geçersiz e-posta veya şifre.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Geçersiz e-posta veya şifre.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Giriş başarılı!',
            token: token
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
});

// JWT Güvenlik Kapısı (Middleware)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Erişim engellendi. Token bulunamadı.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
        }
        req.user = user;
        next();
    });
}

// Korumalı Harcama Ekleme (Sadece giriş yapan kullanıcının ID'si ile kaydeder)
app.post('/transactions', authenticateToken, async (req, res) => {
    try {
        const { amount, type, category, note, date } = req.body;
        const userId = req.user.userId;

        const result = await db.run(
            'INSERT INTO transactions (user_id, amount, type, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, amount, type, category, note, date]
        );

        res.status(201).json({
            message: 'İşlem başarıyla eklendi.',
            id: result.lastID
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Korumalı Harcamaları Listeleme (Sadece giriş yapan kullanıcının verilerini getirir)
app.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const transactions = await db.all('SELECT * FROM transactions WHERE user_id = ?', [userId]);
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 29. Gün: Profil bilgisi getiren endpoint
app.get('/profile', (req, res) => {
  res.json({ message: "Profil bilgileri getirildi" });
});
export default app;
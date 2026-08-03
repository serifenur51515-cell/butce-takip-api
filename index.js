import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let db;

// Veritabanı bağlantısı ve tablo oluşturma
(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL,
            type TEXT,
            category TEXT,
            note TEXT,
            date TEXT
        )
    `);

    console.log('Veritabanı ve transactions tablosu başarıyla hazırlandı!');

    app.listen(PORT, () => {
        console.log(`Sunucu ayağa kalktı! http://localhost:${PORT} adresinden istekleri bekliyor.`);
    });
})();

// 1. TÜM İŞLEMLERİ LİSTELE (GET)
app.get('/transactions', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM transactions');
        res.json(rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. İŞLEM EKLE (POST)
app.post('/transactions', async (req, res) => {
    try {
        const { amount, type, category, note, date } = req.body;
        const result = await db.run(
            'INSERT INTO transactions (amount, type, category, note, date) VALUES (?, ?, ?, ?, ?)',
            [amount, type, category, note, date]
        );
        res.json({ id: result.lastID, amount, type, category, note, date });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
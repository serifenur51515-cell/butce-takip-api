import { db, initializeDatabase } from './database.js';
import express from 'express';

const app = express();
const PORT = 3000;

// Gelen JSON verilerini okuyabilmek için
app.use(express.json());

// 7. Gün: Health Check endpoint'i
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Bütçe Takip API sunucusu sorunsuz çalışıyor!",
        timestamp: new Date()
    });
});

// 9. Gün: YENİ İŞLEM EKLE (POST)
app.post('/transactions', async (req, res) => {
    try {
        const { type, amount, category, note, date } = req.body;

        const result = await db.run(
            `INSERT INTO transactions (type, amount, category, note, date) VALUES (?, ?, ?, ?, ?)`,
            [type, amount, category, note, date]
        );

        res.status(201).json({
            message: "İşlem başarıyla eklendi",
            data: {
                id: result.lastID,
                type,
                amount,
                category,
                note,
                date
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 9. Gün: TÜM İŞLEMLERİ LİSTELE (GET)
app.get('/transactions', async (req, res) => {
    try {
        const rows = await db.all(`SELECT * FROM transactions`);
        res.json({
            message: "Başarılı",
            data: rows
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 8. Gün: Veritabanını başlat ve sunucuyu aç
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Sunucu ayağa kalktı! http://localhost:${PORT} adresinden istekleri bekliyor.`);
    });
}).catch(err => {
    console.error("Veritabanı başlatılırken bir hata oluştu:", err);
});
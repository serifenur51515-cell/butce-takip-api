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
// 10. Gün: İŞLEM SİL (DELETE)
app.delete('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.run(`DELETE FROM transactions WHERE id = ?`, [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Silinmek istenen kayıt bulunamadı." });
        }

        res.json({ message: "İşlem başarıyla silindi.", id: id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// 10. Gün: ÖZET BİLGİ GETİR (GET /summary)
app.get('/summary', async (req, res) => {
    try {
        const totalIncomeResult = await db.get(
            `SELECT SUM(amount) as total FROM transactions WHERE type = 'gelir'`
        );

        const totalExpenseResult = await db.get(
            `SELECT SUM(amount) as total FROM transactions WHERE type = 'gider'`
        );

        const totalIncome = totalIncomeResult.total || 0;
        const totalExpense = totalExpenseResult.total || 0;
        const balance = totalIncome - totalExpense;

        res.json({
            message: "Özet bilgi başarıyla hesaplandı",
            data: {
                totalIncome,
                totalExpense,
                balance
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// --- 11. GÜN: VALIDATION VE HATA YÖNETİMİ ---

// 1. POST /transactions Validation
app.post('/transactions', (req, res) => {
    const { type, amount, category, note } = req.body;

    // Eğer tarih gönderilmediyse otomatik bugün tarihini ata:
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // 1. Zorunlu alan kontrolü
    if (!type || amount === undefined || amount === null) {
        return res.status(400).json({ 
            error: "'type' ve 'amount' alanları zorunludur." 
        });
    }

    // 2. Type kontrolü
    if (type !== 'gelir' && type !== 'gider') {
        return res.status(400).json({ 
            error: "'type' alanı sadece 'gelir' veya 'gider' olabilir." 
        });
    }

    // 3. Amount kontrolü
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ 
            error: "'amount' alanı 0'dan büyük bir sayı olmalıdır." 
        });
    }

    // --- VERİTABANINA EKLEME ---
    const sql = `INSERT INTO transactions (type, amount, category, note, date) VALUES (?, ?, ?, ?, ?)`;
    const params = [type, amount, category || null, note || null, date];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: "Veritabanı hatası: " + err.message });
        }

        res.status(201).json({
            message: "İşlem başarıyla eklendi.",
            data: {
                id: this.lastID,
                type,
                amount,
                category,
                note,
                date
            }
        });
    });
});

// 2. DELETE /transactions/:id Not Found Kontrolü
app.delete('/transactions/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM transactions WHERE id = ?`;

    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: "Veritabanı hatası: " + err.message });
        }

        // Eğer veritabanında bu id bulunamazsa this.changes 0 döner
        if (this.changes === 0) {
            return res.status(404).json({ 
                error: `ID'si ${id} olan bir işlem bulunamadı.` 
            });
        }

        res.status(200).json({ 
            message: `ID'si ${id} olan işlem başarıyla silindi.` 
        });
    });
});
// 8. Gün: Veritabanını başlat ve sunucuyu aç
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Sunucu ayağa kalktı! http://localhost:${PORT} adresinden istekleri bekliyor.`);
    });
}).catch(err => {
    console.error("Veritabanı başlatılırken bir hata oluştu:", err);
});
import express from 'express';
import { initializeDatabase } from './database.js';

const app = express();
const PORT = 3000;

// Gelen JSON verilerini okuyabilmek için
app.use(express.json());

// 7. Günün Hedefi: Basit bir Health Check endpoint'i
app.get('/health', (req, res) => {
    res.status(200).json({
        status: "UP",
        message: "Bütçe Takip API sunucusu sorunsuz çalışıyor!",
        timestamp: new Date()
    });
});

// 8. Günün Hedefi: Önce veritabanını kuruyoruz, sonra sunucuyu açıyoruz
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Sunucu ayağa kalktı! http://localhost:${PORT} adresinden istekleri bekliyor.`);
    });
}).catch(err => {
    console.error("Veritabanı başlatılırken bir hata oluştu:", err);
});
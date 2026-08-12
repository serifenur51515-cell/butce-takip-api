# 💰 Bütçe Takip Uygulaması (Android & Node.js Backend)

Bu proje, kullanıcıların gelir ve giderlerini canlı bir sunucu üzerinden anlık olarak takip edebilmesi, yeni işlem ekleyip silebilmesi amacıyla geliştirilmiş tam yığın (Full-Stack) bir mobil uygulamadır.

## 🚀 Özellikler

* **Canlı API Entegrasyonu:** Render üzerinde barındırılan REST API ile tam senkronize çalışma.
* **Özet Bakiye Kartı:** Toplam bakiye, toplam gelir ve toplam gider verilerinin anlık olarak hesaplanıp gösterilmesi.
* **İşlem Listesi:** Geçmiş harcama ve gelirlerin kategorileriyle birlikte listelenmesi.
* **Dinamik Ekleme Formu:** `FloatingActionButton` (+) üzerinden açılan form ile tür (Gelir/Gider), tutar, kategori, not ve tarih seçilerek veri ekleme.
* **İşlem Silme (DELETE):** Listede bulunan bir işleme uzun basarak canlı veritabanından kaydı silme ve özeti otomatik güncelleme.

## 🛠 Kullanılan Teknolojiler

* **Frontend (Mobil):** Android (Kotlin), Retrofit2, Coroutines, View Binding, RecyclerView, Material Components.
* **Backend:** Node.js, Express.js, Render Cloud Hosting.

## 🔗 API Uç Noktaları (Endpoints)

| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/transactions` | Tüm işlemleri getirir. |
| `GET` | `/summary` | Bakiye, toplam gelir ve gider özetini getirir. |
| `POST` | `/transactions` | Yeni bir gelir/gider işlemi ekler. |
| `DELETE` | `/transactions/:id` | Belirtilen ID'ye sahip işlemi siler. |

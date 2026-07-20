import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export let db;

export async function initializeDatabase() {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            note TEXT,
            date TEXT NOT NULL
        );
    `);

    console.log("Veritabanı ve transactions tablosu başarıyla hazırlandı!");
    return db;
}
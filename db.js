import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tarot.db');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS interpretations (
    card_id TEXT PRIMARY KEY,
    past TEXT,
    present TEXT,
    future TEXT
)`);

export function seedDatabase() {
    const row = db.prepare('SELECT COUNT(*) AS count FROM interpretations').get();
    if (row.count > 0) return;
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'assets/interpretations.json'), 'utf8'));
    const insert = db.prepare('INSERT INTO interpretations (card_id, past, present, future) VALUES (@id, @past, @present, @future)');
    const insertMany = db.transaction((items) => {
        for (const item of items) insert.run(item);
    });
    insertMany(data);
}

export function getInterpretation(cardId, tense) {
    const row = db.prepare('SELECT past, present, future FROM interpretations WHERE card_id = ?').get(cardId);
    if (!row) return null;
    return row[tense];
}

export default db;

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export function createDatabase(): Database.Database {
  const databasePath = process.env.DB_PATH ?? './data/void.sqlite';
  const resolvedPath = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const database = new Database(resolvedPath);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      caller_id TEXT NOT NULL,
      receiver_id TEXT,
      status TEXT NOT NULL CHECK (status IN ('WAITING', 'CONNECTING', 'CONNECTED', 'ENDED', 'FAILED')),
      created_at INTEGER NOT NULL,
      connected_at INTEGER,
      ended_at INTEGER
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL DEFAULT 7,
      category TEXT,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at INTEGER NOT NULL
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS call_events (
      id TEXT PRIMARY KEY,
      call_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN (
        'CALL_STARTED',
        'CALL_CONNECTED',
        'CALL_ENDED',
        'RISK_CHANGED',
        'CHALLENGE_STARTED',
        'CHALLENGE_COMPLETED',
        'CHALLENGE_FAILED',
        'CONNECTION_FAILED'
      )),
      risk_score REAL,
      risk_level TEXT CHECK (risk_level IS NULL OR risk_level IN ('SAFE', 'SUSPICIOUS', 'HIGH')),
      challenge_id TEXT,
      challenge_result TEXT CHECK (challenge_result IS NULL OR challenge_result IN (
        'PASSED',
        'FAILED',
        'INCONCLUSIVE',
        'TIMEOUT'
      )),
      model_version TEXT,
      metadata TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL
    )
  `);

  const seedChallenges = database.prepare(`
    INSERT OR IGNORE INTO challenges
      (id, text, duration_seconds, category, active, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  const seed = database.transaction(() => {
    const createdAt = 1756894500000;
    const challenges = [
      ['ch_001', 'Seven purple birds landed on the blue car.', 7, 'sentence'],
      ['ch_002', 'My blue bicycle is parked near the garden.', 7, 'sentence'],
      ['ch_003', 'Eleven silver stars are shining tonight.', 7, 'numbers'],
      ['ch_004', 'Forty two green apples are on the table.', 7, 'numbers'],
      ['ch_005', 'Please say the word: telescope.', 7, 'unusual_words'],
      ['ch_006', 'A quiet river runs beside the old bridge.', 7, 'sentence'],
      ['ch_007', 'Nine small candles glow beside the window.', 7, 'numbers'],
      ['ch_008', 'Please say the word: marigold.', 7, 'unusual_words'],
      ['ch_009', 'The red notebook is under the wooden chair.', 7, 'sentence'],
      ['ch_010', 'Bright clouds moved across the morning sky.', 7, 'short_phrase']
    ];

    for (const challenge of challenges) {
      seedChallenges.run(...challenge, createdAt);
    }
  });
  seed();

  return database;
}
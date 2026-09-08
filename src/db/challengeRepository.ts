import Database from 'better-sqlite3';
import { ChallengeRecord } from '../types/challenge';

export class ChallengeRepository {
  constructor(private readonly database: Database.Database) {}

  findRandomActive(): ChallengeRecord | undefined {
    return this.database.prepare(`
      SELECT * FROM challenges
      WHERE active = 1
      ORDER BY RANDOM()
      LIMIT 1
    `).get() as ChallengeRecord | undefined;
  }

  findActiveById(id: string): ChallengeRecord | undefined {
    return this.database.prepare(`
      SELECT * FROM challenges
      WHERE id = ? AND active = 1
    `).get(id) as ChallengeRecord | undefined;
  }
}
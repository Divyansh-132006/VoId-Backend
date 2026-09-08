import Database from 'better-sqlite3';
import { CallRecord, CallStatus } from '../types/call';

export class CallRepository {
  constructor(private readonly database: Database.Database) {}

  create(call: CallRecord): void {
    this.database.prepare(`
      INSERT INTO calls (id, room_id, caller_id, receiver_id, status, created_at, connected_at, ended_at)
      VALUES (@id, @room_id, @caller_id, @receiver_id, @status, @created_at, @connected_at, @ended_at)
    `).run(call);
  }

  findById(id: string): CallRecord | undefined {
    return this.database.prepare('SELECT * FROM calls WHERE id = ?').get(id) as CallRecord | undefined;
  }

  updateStatus(id: string, status: CallStatus, endedAt: number | null = null): void {
    this.database.prepare(`
      UPDATE calls
      SET status = ?, ended_at = ?
      WHERE id = ?
    `).run(status, endedAt, id);
  }
}
import Database from 'better-sqlite3';
import { CallRecord } from '../types/call';
import { DashboardEvent } from '../types/dashboard';

const eventColumns = `
  id, call_id, device_id, event_type, risk_score, risk_level,
  challenge_id, challenge_result, model_version, timestamp
`;

export class DashboardRepository {
  constructor(private readonly database: Database.Database) {}

  listCalls(limit = 50): CallRecord[] {
    return this.database.prepare(`
      SELECT id, room_id, caller_id, receiver_id, status,
        created_at, connected_at, ended_at
      FROM calls
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as CallRecord[];
  }

  listEvents(limit = 50): DashboardEvent[] {
    return this.database.prepare(`
      SELECT ${eventColumns}
      FROM call_events
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as DashboardEvent[];
  }

  listChallengeEvents(limit = 50): DashboardEvent[] {
    return this.database.prepare(`
      SELECT ${eventColumns}
      FROM call_events
      WHERE event_type IN ('CHALLENGE_STARTED', 'CHALLENGE_COMPLETED', 'CHALLENGE_FAILED')
        OR challenge_id IS NOT NULL
        OR challenge_result IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as DashboardEvent[];
  }
}
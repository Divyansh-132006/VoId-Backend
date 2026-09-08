import Database from 'better-sqlite3';
import { EventRecord } from '../types/event';

export class EventRepository {
  constructor(private readonly database: Database.Database) {}

  create(event: EventRecord): void {
    this.database.prepare(`
      INSERT INTO call_events (
        id, call_id, device_id, event_type, risk_score, risk_level,
        challenge_id, challenge_result, model_version, metadata, timestamp
      )
      VALUES (
        @id, @call_id, @device_id, @event_type, @risk_score, @risk_level,
        @challenge_id, @challenge_result, @model_version, @metadata, @timestamp
      )
    `).run(event);
  }
}
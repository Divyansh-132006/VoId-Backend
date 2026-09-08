import { randomUUID } from 'node:crypto';
import { CallRepository } from '../db/callRepository';
import { EventRepository } from '../db/eventRepository';
import { EventRecord } from '../types/event';
import { AppError } from '../utils/errors';

export interface CreateEventInput {
  call_id: string;
  device_id: string;
  event_type: EventRecord['event_type'];
  risk_score: number | null;
  risk_level: EventRecord['risk_level'];
  challenge_id: string | null;
  challenge_result: EventRecord['challenge_result'];
  model_version: string | null;
  timestamp: number;
}

export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly calls: CallRepository
  ) {}

  create(input: CreateEventInput): EventRecord {
    if (!this.calls.findById(input.call_id)) {
      throw new AppError(404, 'CALL_NOT_FOUND', 'Call does not exist or has expired.');
    }

    const event: EventRecord = {
      id: `event_${randomUUID()}`,
      ...input,
      metadata: null
    };
    this.events.create(event);
    return event;
  }
}
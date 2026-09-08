import { randomUUID } from 'node:crypto';
import { CallRepository } from '../db/callRepository';
import { CallRecord, CallStatus } from '../types/call';
import { AppError } from '../utils/errors';

export class CallService {
  constructor(private readonly calls: CallRepository) {}

  create(callerId: string, receiverId: string | null): CallRecord {
    const call: CallRecord = {
      id: `call_${randomUUID()}`,
      room_id: `room_${randomUUID()}`,
      caller_id: callerId,
      receiver_id: receiverId,
      status: CallStatus.WAITING,
      created_at: Date.now(),
      connected_at: null,
      ended_at: null
    };
    this.calls.create(call);
    return call;
  }

  get(callId: string): CallRecord {
    const call = this.calls.findById(callId);
    if (!call) {
      throw new AppError(404, 'CALL_NOT_FOUND', 'Call does not exist or has expired.');
    }
    return call;
  }

  join(callId: string): CallRecord {
    const call = this.get(callId);
    if (call.status !== CallStatus.WAITING) {
      throw new AppError(409, 'INVALID_CALL_STATE', 'Only a waiting call can be joined.');
    }
    this.calls.updateStatus(callId, CallStatus.CONNECTING);
    return this.get(callId);
  }

  end(callId: string): CallRecord {
    const call = this.get(callId);
    if (call.status === CallStatus.ENDED) {
      throw new AppError(409, 'INVALID_CALL_STATE', 'Call has already ended.');
    }
    this.calls.updateStatus(callId, CallStatus.ENDED, Date.now());
    return this.get(callId);
  }
}
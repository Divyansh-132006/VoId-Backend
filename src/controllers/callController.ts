import { Request, Response } from 'express';
import { CallService } from '../services/callService';
import { AppError } from '../utils/errors';

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a non-empty string.`);
  }
  return value.trim();
}

function toResponse(call: ReturnType<CallService['get']>) {
  return {
    callId: call.id,
    roomId: call.room_id,
    callerId: call.caller_id,
    receiverId: call.receiver_id,
    status: call.status,
    createdAt: call.created_at,
    connectedAt: call.connected_at,
    endedAt: call.ended_at
  };
}

export function createCallController(service: CallService) {
  return {
    create: (request: Request, response: Response) => {
      const body = request.body as Record<string, unknown>;
      const callerId = requireString(body?.callerId, 'callerId');
      const receiverId = body?.receiverId === undefined || body.receiverId === null
        ? null
        : requireString(body.receiverId, 'receiverId');
      const call = service.create(callerId, receiverId);
      response.status(201).json({
        callId: call.id,
        roomId: call.room_id,
        status: call.status,
        createdAt: call.created_at
      });
    },
    get: (request: Request, response: Response) => {
      response.json(toResponse(service.get(requireString(request.params.callId, 'callId'))));
    },
    join: (request: Request, response: Response) => {
      requireString((request.body as Record<string, unknown>)?.deviceId, 'deviceId');
      const call = service.join(requireString(request.params.callId, 'callId'));
      response.json({ callId: call.id, roomId: call.room_id, status: call.status });
    },
    end: (request: Request, response: Response) => {
      requireString((request.body as Record<string, unknown>)?.deviceId, 'deviceId');
      const call = service.end(requireString(request.params.callId, 'callId'));
      response.json({ callId: call.id, status: call.status, endedAt: call.ended_at });
    }
  };
}
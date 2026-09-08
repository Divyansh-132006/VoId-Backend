import { Request, Response } from 'express';
import { EventService } from '../services/eventService';
import { challengeResults, eventTypes, riskLevels } from '../types/event';
import { AppError } from '../utils/errors';

const allowedFields = new Set([
  'callId',
  'deviceId',
  'event',
  'timestamp',
  'riskScore',
  'riskLevel',
  'challengeId',
  'challengeResult',
  'modelVersion'
]);

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a non-empty string.`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return requireString(value, field);
}

function requireEnum<T extends readonly string[]>(value: unknown, field: string, values: T): T[number] {
  if (typeof value !== 'string' || !values.includes(value)) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be one of: ${values.join(', ')}.`);
  }
  return value as T[number];
}

function optionalEnum<T extends readonly string[]>(value: unknown, field: string, values: T): T[number] | null {
  if (value === undefined || value === null) {
    return null;
  }
  return requireEnum(value, field, values);
}

function requireTimestamp(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'timestamp must be a positive Unix timestamp in milliseconds.');
  }
  return value;
}

function optionalRiskScore(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'riskScore must be a number between 0 and 1.');
  }
  return value;
}

export function createEventController(service: EventService) {
  return {
    create: (request: Request, response: Response) => {
      const body = request.body;
      if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
      }

      const unknownField = Object.keys(body).find((field) => !allowedFields.has(field));
      if (unknownField) {
        throw new AppError(400, 'VALIDATION_ERROR', `${unknownField} is not an allowed event field.`);
      }

      const values = body as Record<string, unknown>;
      const event = service.create({
        call_id: requireString(values.callId, 'callId'),
        device_id: requireString(values.deviceId, 'deviceId'),
        event_type: requireEnum(values.event, 'event', eventTypes),
        risk_score: optionalRiskScore(values.riskScore),
        risk_level: optionalEnum(values.riskLevel, 'riskLevel', riskLevels),
        challenge_id: optionalString(values.challengeId, 'challengeId'),
        challenge_result: optionalEnum(values.challengeResult, 'challengeResult', challengeResults),
        model_version: optionalString(values.modelVersion, 'modelVersion'),
        timestamp: requireTimestamp(values.timestamp)
      });

      response.status(201).json({
        eventId: event.id,
        callId: event.call_id,
        timestamp: event.timestamp
      });
    }
  };
}
import { Request, Response } from 'express';
import { ChallengeService } from '../services/challengeService';
import { AppError } from '../utils/errors';

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', `${field} must be a non-empty string.`);
  }
  return value.trim();
}

function toResponse(challenge: ReturnType<ChallengeService['get']>) {
  return {
    id: challenge.id,
    text: challenge.text,
    durationSeconds: challenge.duration_seconds,
    ...(challenge.category === null ? {} : { category: challenge.category })
  };
}

export function createChallengeController(service: ChallengeService) {
  return {
    random: (_request: Request, response: Response) => {
      response.json(toResponse(service.random()));
    },
    get: (request: Request, response: Response) => {
      response.json(toResponse(service.get(requireString(request.params.challengeId, 'challengeId'))));
    }
  };
}
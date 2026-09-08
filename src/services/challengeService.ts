import { ChallengeRepository } from '../db/challengeRepository';
import { ChallengeRecord } from '../types/challenge';
import { AppError } from '../utils/errors';

export class ChallengeService {
  constructor(private readonly challenges: ChallengeRepository) {}

  random(): ChallengeRecord {
    const challenge = this.challenges.findRandomActive();
    if (!challenge) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'No active challenge is available.');
    }
    return challenge;
  }

  get(challengeId: string): ChallengeRecord {
    const challenge = this.challenges.findActiveById(challengeId);
    if (!challenge) {
      throw new AppError(404, 'CHALLENGE_NOT_FOUND', 'Challenge does not exist.');
    }
    return challenge;
  }
}
export const eventTypes = [
  'CALL_STARTED',
  'CALL_CONNECTED',
  'CALL_ENDED',
  'RISK_CHANGED',
  'CHALLENGE_STARTED',
  'CHALLENGE_COMPLETED',
  'CHALLENGE_FAILED',
  'CONNECTION_FAILED'
] as const;

export const riskLevels = ['SAFE', 'SUSPICIOUS', 'HIGH'] as const;
export const challengeResults = ['PASSED', 'FAILED', 'INCONCLUSIVE', 'TIMEOUT'] as const;

export type EventType = typeof eventTypes[number];
export type RiskLevel = typeof riskLevels[number];
export type ChallengeResult = typeof challengeResults[number];

export interface EventRecord {
  id: string;
  call_id: string;
  device_id: string;
  event_type: EventType;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  challenge_id: string | null;
  challenge_result: ChallengeResult | null;
  model_version: string | null;
  metadata: string | null;
  timestamp: number;
}
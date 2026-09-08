export interface ChallengeRecord {
  id: string;
  text: string;
  duration_seconds: number;
  category: string | null;
  active: number;
  created_at: number;
}
import { EventRecord } from './event';
import { CallRecord } from './call';

export interface DashboardEvent extends Pick<
  EventRecord,
  'id' | 'call_id' | 'device_id' | 'event_type' | 'risk_score' | 'risk_level'
    | 'challenge_id' | 'challenge_result' | 'model_version' | 'timestamp'
> {}

export interface DashboardData {
  calls: CallRecord[];
  events: DashboardEvent[];
  challengeEvents: DashboardEvent[];
}
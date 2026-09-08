export enum CallStatus {
  WAITING = 'WAITING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  FAILED = 'FAILED'
}

export interface CallRecord {
  id: string;
  room_id: string;
  caller_id: string;
  receiver_id: string | null;
  status: CallStatus;
  created_at: number;
  connected_at: number | null;
  ended_at: number | null;
}
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'node:http';

type SignalingMessage = {
  type: unknown;
  roomId?: unknown;
  deviceId?: unknown;
  sdp?: unknown;
  candidate?: unknown;
};

type Peer = {
  socket: WebSocket;
  roomId?: string;
  deviceId?: string;
};

const ROOM_FULL_MESSAGE = {
  error: {
    code: 'ROOM_FULL',
    message: 'This call already has two participants.'
  }
};

const rooms = new Map<string, Set<Peer>>();

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function send(socket: WebSocket, message: unknown): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function sendInvalidMessage(socket: WebSocket, message: string): void {
  send(socket, { error: { code: 'INVALID_MESSAGE', message } });
}

function removePeer(peer: Peer, notify: boolean): void {
  if (!peer.roomId || !peer.deviceId) {
    return;
  }

  const room = rooms.get(peer.roomId);
  if (!room) {
    peer.roomId = undefined;
    peer.deviceId = undefined;
    return;
  }

  room.delete(peer);
  if (notify) {
    const peerLeft = {
      type: 'peer_left',
      roomId: peer.roomId,
      deviceId: peer.deviceId
    };
    for (const remainingPeer of room) {
      send(remainingPeer.socket, peerLeft);
    }
  }

  if (room.size === 0) {
    rooms.delete(peer.roomId);
  }
  peer.roomId = undefined;
  peer.deviceId = undefined;
}

function getPeerRoom(peer: Peer, message: SignalingMessage): Set<Peer> | undefined {
  if (!peer.roomId || !peer.deviceId) {
    sendInvalidMessage(peer.socket, 'Join a room before sending signaling messages.');
    return undefined;
  }
  if (message.roomId !== peer.roomId || message.deviceId !== peer.deviceId) {
    sendInvalidMessage(peer.socket, 'roomId and deviceId must match the joined connection.');
    return undefined;
  }
  return rooms.get(peer.roomId);
}

function handleMessage(peer: Peer, rawMessage: string): void {
  let message: SignalingMessage;
  try {
    message = JSON.parse(rawMessage) as SignalingMessage;
  } catch {
    sendInvalidMessage(peer.socket, 'Message must be valid JSON.');
    return;
  }

  if (!message || typeof message !== 'object' || Array.isArray(message) || !isNonEmptyString(message.type)) {
    sendInvalidMessage(peer.socket, 'Message type is required.');
    return;
  }

  if (message.type === 'join') {
    if (!isNonEmptyString(message.roomId) || !isNonEmptyString(message.deviceId)) {
      sendInvalidMessage(peer.socket, 'join requires roomId and deviceId.');
      return;
    }
    if (peer.roomId) {
      sendInvalidMessage(peer.socket, 'This connection has already joined a room.');
      return;
    }

    const room = rooms.get(message.roomId) ?? new Set<Peer>();
    if (room.size >= 2) {
      send(peer.socket, ROOM_FULL_MESSAGE);
      peer.socket.close(1008);
      return;
    }

    peer.roomId = message.roomId;
    peer.deviceId = message.deviceId;
    room.add(peer);
    rooms.set(message.roomId, room);

    if (room.size === 2) {
      for (const existingPeer of room) {
        if (existingPeer !== peer) {
          send(existingPeer.socket, {
            type: 'peer_joined',
            roomId: message.roomId,
            deviceId: message.deviceId
          });
        }
      }
    }
    return;
  }

  const room = getPeerRoom(peer, message);
  if (!room) {
    return;
  }

  if (message.type === 'offer' || message.type === 'answer') {
    if (!isNonEmptyString(message.sdp)) {
      sendInvalidMessage(peer.socket, `${message.type} requires sdp.`);
      return;
    }
  } else if (message.type === 'ice') {
    if (!message.candidate || typeof message.candidate !== 'object' || Array.isArray(message.candidate)) {
      sendInvalidMessage(peer.socket, 'ice requires a candidate object.');
      return;
    }
    const candidate = message.candidate as Record<string, unknown>;
    if (!isNonEmptyString(candidate.candidate)
      || !isNonEmptyString(candidate.sdpMid)
      || typeof candidate.sdpMLineIndex !== 'number') {
      sendInvalidMessage(peer.socket, 'ice candidate requires candidate, sdpMid, and sdpMLineIndex.');
      return;
    }
  } else if (message.type === 'leave') {
    removePeer(peer, true);
    peer.socket.close(1000);
    return;
  } else {
    sendInvalidMessage(peer.socket, `Unsupported message type: ${message.type}.`);
    return;
  }

  for (const otherPeer of room) {
    if (otherPeer !== peer) {
      otherPeer.socket.send(rawMessage);
    }
  }
}

export function attachSignaling(server: import('node:http').Server): WebSocketServer {
  const websocketServer = new WebSocketServer({ server, path: '/signal' });
  websocketServer.on('connection', (socket: WebSocket, _request: IncomingMessage) => {
    const peer: Peer = { socket };
    socket.on('message', (data) => handleMessage(peer, data.toString()));
    socket.on('close', () => removePeer(peer, true));
    socket.on('error', () => removePeer(peer, true));
  });
  return websocketServer;
}

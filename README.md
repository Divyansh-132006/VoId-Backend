# VoiceShield Backend

VoiceShield is a privacy-focused voice-call security system. In the intended product, two phones establish a call using WebRTC, the backend provides call/session APIs and WebSocket signaling, media travels directly between phones, and voice analysis happens on-device.

The current Day 1 backend implements call metadata and the WebSocket signaling layer required for WebRTC setup. It does **not** implement the Android WebRTC media/audio client or an actual voice call. The backend does not carry, process, or store call audio.

## Features

Implemented:

- Node.js + TypeScript and Express HTTP server
- SQLite call metadata database
- `GET /health`
- Call/session APIs and unique room creation
- WebSocket signaling at `/signal`
- Two-peer room limit
- SDP offer/answer and ICE candidate relay
- Join, leave, and disconnect handling
- Temporary browser signaling client at `/signal-test`

Not yet implemented: the Android WebRTC media/audio client, actual voice calling, challenge APIs and seed data, event logging, dashboard, and production deployment.

## Architecture

Current Day 1 signaling path:

```text
Phone A
	|
	| WebSocket signaling
	v
VoiceShield Backend
	|
	| WebSocket signaling
	v
Phone B
```

Intended final architecture:

```text
Phone A  <======== WebRTC media ========>  Phone B
	\                                      /
	 \---- WebSocket signaling ---------/
				 VoiceShield Backend
```

The backend is intended to handle call/session metadata, signaling, challenges, explicitly sent security events, and dashboard data. Only call metadata and signaling are currently implemented. The backend does not carry audio.

## Project Structure

```text
backend/
├── src/
│   ├── controllers/callController.ts  # HTTP request validation and responses
│   ├── db/callRepository.ts            # calls table queries
│   ├── db/database.ts                 # SQLite setup and schema creation
│   ├── middleware/errorHandler.ts     # HTTP error responses
│   ├── routes/callRoutes.ts            # call endpoint registration
│   ├── services/callService.ts        # call lifecycle rules
│   ├── types/call.ts                  # call record and status types
│   ├── utils/errors.ts                # application error type
│   ├── websocket/signaling.ts         # room membership and message relay
│   └── server.ts                      # Express and HTTP/WebSocket startup
├── data/void.sqlite                   # runtime database, ignored by Git
├── signal-test.html                   # temporary browser signaling client
├── package.json                       # dependencies and npm scripts
├── package-lock.json                  # locked dependency tree
├── tsconfig.json                      # TypeScript compiler settings
├── .env.example                       # supported environment variables
└── README.md                          # backend documentation
```

The repository also contains the reference contracts in [docs/backend-api.md](../docs/backend-api.md), [docs/database-schema.md](../docs/database-schema.md), and [docs/integration.md](../docs/integration.md). See [docs/PROJECT-STRUCTURE.md](../docs/PROJECT-STRUCTURE.md) for a fuller explanation.

## Tech Stack

Declared dependencies are TypeScript `^5.7.3`, Express `^4.21.2`, `ws` `^8.21.3`, `better-sqlite3` `^11.10.0`, `dotenv` `^16.4.7`, and `tsx` `^4.19.3`. Node.js and npm provide the runtime and package tooling. Node 22 LTS is the currently used development environment; no Node version is pinned in the project.

## Prerequisites

Install Node.js 22 LTS (or a version compatible with the native `better-sqlite3` binding), npm, and Git. A browser is needed for the test page. For phone testing, put the PC and both phones on the same reachable LAN/Wi-Fi.

## Installation

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <cloned-repository>/backend
npm install
```

## Environment Configuration

Copy `.env.example` to `.env` if you need to change defaults.

| Variable | Default | Use |
|---|---|---|
| `PORT` | `3000` | HTTP and WebSocket port |
| `DB_PATH` | `./data/void.sqlite` | SQLite path, resolved from the process working directory |

No other environment variables are read by the current backend.

## Running the Server

```bash
npm run dev
```

Expected startup output:

```text
VoiceShield backend listening on port 3000
```

## Health Check

On the PC, open `http://localhost:3000/health` or run `curl http://localhost:3000/health`. The response is:

```json
{"status":"ok","version":"1.0.0"}
```

From an Android phone on the same LAN, open `http://<PC_IP>:3000/health`, for example `http://192.168.1.26:3000/health`. Do not use `localhost` on the phone because it means the phone itself. Windows Firewall may need to allow Node.js or port 3000.

## Call API

All bodies are JSON. HTTP errors use `{ "error": { "code": "...", "message": "..." } }`.

### `POST /api/calls`

Creates call metadata and a unique room. `receiverId` may be omitted.

Request:

```json
{"callerId":"device_A","receiverId":"device_B"}
```

Response (`201`):

```json
{"callId":"call_<uuid>","roomId":"room_<uuid>","status":"WAITING","createdAt":1756894500000}
```

Missing or blank `callerId`, or an invalid supplied `receiverId`, returns `400 VALIDATION_ERROR`.

### `GET /api/calls/:callId`

Returns the stored call:

```json
{"callId":"call_<uuid>","roomId":"room_<uuid>","callerId":"device_A","receiverId":"device_B","status":"WAITING","createdAt":1756894500000,"connectedAt":null,"endedAt":null}
```

An unknown ID returns `404 CALL_NOT_FOUND`; a blank ID returns `400 VALIDATION_ERROR`.

### `POST /api/calls/:callId/join`

Request: `{"deviceId":"device_B"}`. A non-empty `deviceId` is required. Response (`200`) is `{"callId":"call_<uuid>","roomId":"room_<uuid>","status":"CONNECTING"}`. Only `WAITING` calls can be joined; invalid state returns `409 INVALID_CALL_STATE`, and an unknown call returns `404 CALL_NOT_FOUND`. The current code validates `deviceId` but does not use it for authorization.

### `POST /api/calls/:callId/end`

Request: `{"deviceId":"device_A"}`. Response (`200`) is `{"callId":"call_<uuid>","status":"ENDED","endedAt":1756894715000}`. Unknown calls return `404 CALL_NOT_FOUND`; ending an already ended call returns `409 INVALID_CALL_STATE`.

The current lifecycle is `WAITING` -> `CONNECTING` on join -> `ENDED` on end. It does not transition to `CONNECTED` or populate `connectedAt`.

## WebSocket Signaling

Connect to `ws://<PC_IP>:3000/signal`. Each connection can join one room. `roomId` and `deviceId` must be non-empty strings, and subsequent messages must match the joined values.

Join:

```json
{"type":"join","roomId":"room_456","deviceId":"device_A"}
```

When peer B joins, peer A receives:

```json
{"type":"peer_joined","roomId":"room_456","deviceId":"device_B"}
```

Offer and answer messages require a non-empty SDP and are relayed unchanged:

```json
{"type":"offer","roomId":"room_456","deviceId":"device_A","sdp":"<SDP_STRING>"}
```

```json
{"type":"answer","roomId":"room_456","deviceId":"device_B","sdp":"<SDP_STRING>"}
```

ICE messages require and relay this candidate shape:

```json
{"type":"ice","roomId":"room_456","deviceId":"device_A","candidate":{"candidate":"candidate:...","sdpMid":"0","sdpMLineIndex":0}}
```

Leave:

```json
{"type":"leave","roomId":"room_456","deviceId":"device_A"}
```

The leaving socket is removed and closed with code `1000`; the other peer receives `{"type":"peer_left","roomId":"room_456","deviceId":"device_A"}`. Socket close/error events also remove the peer and notify the remaining peer.

Rooms allow at most two peers. A third receives:

```json
{"error":{"code":"ROOM_FULL","message":"This call already has two participants."}}
```

and is closed with code `1008`. Invalid JSON, missing fields, mismatched IDs, and unsupported types return `INVALID_MESSAGE`. SDP and ICE are setup data only: the backend relays them but does not carry, process, or store actual audio.

## Two-Phone Local Testing

1. From `backend/`, run `npm run dev`.
2. Run `ipconfig` and note the PC's LAN IPv4 address.
3. On both phones open `http://<PC_IP>:3000/signal-test`.
4. Phone 1: `roomId = demo-room`, `deviceId = phone-1`; tap **Connect**, then **Join**.
5. Phone 2: `roomId = demo-room`, `deviceId = phone-2`; tap **Connect**, then **Join**.

Phone 1 should log `peer_joined` for phone 2. Leaving one phone should make the other log `peer_left`. This tests signaling, not an actual voice call. Two phones have been manually verified to connect over LAN and receive `peer_joined`; that is external runtime verification, not an automated repository test.

## Database

On startup, `src/db/database.ts` creates the parent directory, opens `DB_PATH`, enables WAL mode, and creates the `calls` table if needed. The table stores call ID, room ID, caller/receiver IDs, status, and Unix-millisecond `created_at`, `connected_at`, and `ended_at` values. The default is `backend/data/void.sqlite` when started from `backend/`.

The challenge, event, and dashboard tables/APIs in the specification are Day 2 work and are not in the current backend. Raw audio, recordings, voice samples, transcripts, audio embeddings/features, and ML audio payloads are not stored.

## Privacy Boundary

The backend receives/stores call/session metadata and, in future, explicitly sent security/risk metadata. It transiently relays WebRTC setup messages. It does not receive or store raw call audio, recordings, voice samples, transcripts, audio embeddings/features, or ML audio payloads.

## Current Day 1 Status

- [x] Node/TypeScript backend
- [x] Environment configuration
- [x] Health API
- [x] SQLite call metadata
- [x] Call/session APIs
- [x] Room creation
- [x] WebSocket signaling
- [x] SDP offer/answer relay
- [x] ICE relay
- [x] Leave/disconnect handling
- [x] Two-client signaling test capability

Actual Android WebRTC media calling is **not** part of the completed Day 1 backend implementation.

## What's Next

### Day 2 - Not Yet Implemented

- Challenge API and 10-20 seeded challenges
- Metadata-only security event logging
- Dashboard
- Integration testing

### Day 3 - Planned

- Reliability fixes, room cleanup, and duplicate/stale session handling
- Deployment and API contract freeze
- Final integration testing

## Troubleshooting

- Node 24 can have native `better-sqlite3` binding issues; Node 22 LTS is the currently used working environment.
- A phone cannot use `localhost`; use the PC LAN IP.
- The PC and phone must be on the same reachable LAN for local testing.
- Windows Firewall may need to allow Node.js or port 3000.

## Development Commands

```bash
npm install
npm run dev
npm run build
```
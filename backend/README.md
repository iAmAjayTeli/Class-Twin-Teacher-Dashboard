# ClassTwin Backend

Node.js + Express real-time backend powering the ClassTwin teacher dashboard.

## Services

| File | Purpose |
|---|---|
| `server.js` | Express server, Socket.io setup, API routes |
| `sessionManager.js` | In-memory session, round, and student management |
| `riskEngine.js` | Comprehension scoring and failure prediction |
| `aiService.js` | AI insight generation (Claude API + fallback) |
| `livekitService.js` | LiveKit token generation and room management |
| `twinChatService.js` | AI co-pilot chat service |
| `supabaseClient.js` | Supabase client configuration |

## Quick Start

`ash
cp .env.example .env
# Fill in your API keys
npm install
npm run dev
`

The server runs on port `3001` by default.

## API Endpoints

- `POST /api/sessions` â€” Create a new session
- `POST /api/sessions/:id/start-stream` â€” Start LiveKit stream
- `POST /api/sessions/:id/stop-stream` â€” Stop LiveKit stream
- `POST /api/livekit/token` â€” Generate LiveKit viewer token

## WebSocket Events

- `join_teacher_room` â€” Teacher joins session room
- `student_joined` â€” Student connected
- `twin_update` â€” Real-time comprehension data
- `round_start` â€” New quiz round started
- `session_ended` â€” Session completed

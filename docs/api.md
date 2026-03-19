# backendgameJs API Documentation

Base path: `/api`

All API responses use the `BaseResponse` structure:
- `status`: HTTP status code
- `message`: human-readable message
- `success`: boolean
- `data`: payload

Common headers
- `Content-Type: application/json`
- `Authorization: Bearer <accessToken>` for protected endpoints

Endpoints

**Health**
- Method: GET
- URL: `/` (root)
- Auth: no
- Description: Verify server is up
- Success response example:

```
{ "ok": true, "message": "be-games API" }
```

**Register**
- Method: POST
- URL: `/api/auth/register`
- Auth: no
- Request body (application/json):
  - `username` (string, min 3)
  - `email` (string, valid email)
  - `password` (string, min 6)

Request example:
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com",
  "password": "securepass"
}
```

Success response (201):
```
{
  "status": 201,
  "message": "User registered successfully",
  "success": true,
  "data": {
    "_id": "603...",
    "username": "alice",
    "email": "alice@example.com",
    "role": "user",
    "createdAt": "2023-...",
    "updatedAt": "2023-..."
  }
}
```

Errors:
- 400: validation errors (zod), or email already in use

**Login**
- Method: POST
- URL: `/api/auth/login`
- Auth: no
- Request body:
  - `email` (string)
  - `password` (string)

Request example:
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "securepass"
}
```

Success response (200):
```
{
  "status": 200,
  "message": "Logged in successfully",
  "success": true,
  "data": {
    "user": { "_id": "603...", "username": "alice", "email": "alice@example.com", "role": "user", "createdAt": "..." },
    "accessToken": "<jwt-access-token>",
    "refreshToken": "<jwt-refresh-token>"
  }
}
```

Errors:
- 400: invalid credentials or validation errors

**Refresh access token**
- Method: POST
- URL: `/api/auth/refresh`
- Auth: no (expects refresh token in body)
- Request body:
  - `token` (string) — the refresh token

Request example:
```
POST /api/auth/refresh
Content-Type: application/json

{ "token": "<refresh-token>" }
```

Success response (200):
```
{
  "status": 200,
  "message": "Access token refreshed",
  "success": true,
  "data": { "accessToken": "<new-access-token>" }
}
```

Errors:
- 400: invalid token format / expired
- 401 / 403: if token invalid or not recognized

**Get user profile**
- Method: GET
- URL: `/api/auth/profile/:id`
- Auth: yes — require `Authorization: Bearer <accessToken>`
- Path params:
  - `id` (string) — MongoDB ObjectId of user

Request example:
```
GET /api/auth/profile/603...
Authorization: Bearer <access-token>
```

Success response (200):
```
{
  "status": 200,
  "message": "Profile fetched successfully",
  "success": true,
  "data": {
    "_id": "603...",
    "username": "alice",
    "email": "alice@example.com",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Errors:
- 400: invalid id format
- 401: missing `Authorization` header
- 403: invalid/expired access token
- 404: user not found

Notes for frontend
- Base URL prefix used in server: `app.use('/api', ...)` so all auth routes are under `/api/auth`.
- Login returns both `accessToken` and `refreshToken`. Use `accessToken` in `Authorization: Bearer <token>` for protected requests.
- Access tokens expire quickly (service sets `ACCESS_EXPIRE = 15m`), use `/api/auth/refresh` to obtain a new access token using the `refreshToken`.
- Responses follow `BaseResponse` shape; look at `src/lib/baseresponse.ts` for structure.

Example curl (register):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"securepass"}'
```

Example curl (login):

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"securepass"}'
```

Where to find implementation
- Controller: `src/controllers/user.controller.ts`
- Routes: `src/routes/user.routes.ts` and `src/routes/index.ts`
- Schemas: `src/schema/user.schema.ts`
- Service: `src/service/user.service.impl.ts`
- Response wrapper: `src/lib/baseresponse.ts`

If bạn muốn, tôi sẽ:
- Thêm examples cho frontend (TypeScript fetch/axios snippets)
- Thêm mô tả lỗi chi tiết từ controller/service

---

# WebSocket (Socket.IO) Events

**Connection**
- Connect to: `ws://<server>` or `wss://<server>` (same host as REST API)
- Auth: send JWT access token in the handshake:
  ```js
  const socket = io(SERVER_URL, {
    auth: { token: accessToken },
  });
  ```

## Event list

### `join_room`
- Client -> Server
- Payload: `{ matchId: string }`
- Server will join socket to the room named by the matchId.

### `player_joined`
- Server -> Room
- Payload: `{ player: { userId: string } }`
- Sent when a player joins the room.

### `toggle_ready`
- Client -> Server
- Payload: `{ matchId: string, ready: boolean }`
- Server broadcasts to the room and, when both players are ready, triggers `start_game`.

### `start_game`
- Server -> Room
- Payload:
  ```json
  {
    "matchId": "...",
    "currentTurn": "<userId>",
    "turnTimeLimit": 30
  }
  ```
- Triggers when both players are ready.

### `timer_tick`
- Server -> Room
- Sent every second during an active game:
  ```json
  { "remaining": 27 }
  ```

### `send_move`
- Client -> Server
- Payload: `{ matchId: string, x: number, y: number, action: string }`

### `move_result`
- Server -> Room
- Payload:
  ```json
  {
    "userId": "...",
    "x": 1,
    "y": 2,
    "action": "open",
    "result": "safe|bomb",
    "health": 2
  }
  ```

### `player_left`
- Server -> Room
- Payload: `{ userId: string }`
- Sent when a player disconnects for more than 30s.

### `game_over`
- Server -> Room
- Payload: `{ winnerId: string | null, loserId: string }`

---

> ⚠️ Note: Socket server uses the same CORS origins as the REST API.



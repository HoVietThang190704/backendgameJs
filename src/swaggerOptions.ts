export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Minesweeper Game Backend API",
      version: "1.0.0",
      description: "API documentation for DoAnGameDoiKhangDoMin backendgameJs",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Local development server (API prefix)",
      },
      {
        url: "http://localhost:5000",
        description: "Legacy root server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "642f1e7dc1d3d75b8f89c123" },
            username: { type: "string", example: "player1" },
            email: { type: "string", format: "email", example: "player1@example.com" },
            name: { type: "string", example: "Nguyen Van A" },
            rule: { type: "string", example: "user" },
            avatar_url: { type: "string", format: "uri", example: "https://example.com/avatar.png" },
            isActive: { type: "boolean", example: true },
            currentMatchId: { type: "string", nullable: true, example: "642f1e7dc1d3d75b8f89c456" },
            created: {
              type: "object",
              properties: { time: { type: "string", format: "date-time" } },
            },
            modified: {
              type: "object",
              properties: { time: { type: "string", format: "date-time" } },
            },
          },
        },
        MatchPlayer: {
          type: "object",
          properties: {
            userId: { type: "string", example: "642f1e7dc1d3d75b8f89c123" },
            isReady: { type: "boolean", example: true },
            health: { type: "integer", example: 3 },
          },
        },
        Match: {
          type: "object",
          properties: {
            _id: { type: "string", example: "642f1e7dc1d3d75b8f89c789" },
            matchType: { type: "string", example: "private" },
            status: { type: "string", example: "waiting" },
            pinCode: { type: "string", example: "1234" },
            hostId: { type: "string", example: "642f1e7dc1d3d75b8f89c123" },
            players: { type: "array", items: { $ref: "#/components/schemas/MatchPlayer" } },
            gameBoard: {
              type: "object",
              properties: {
                rows: { type: "integer", example: 10 },
                cols: { type: "integer", example: 10 },
                bombs: { type: "integer", example: 20 },
              },
            },
            turnTimeLimit: { type: "integer", example: 30 },
            currentTurn: { type: "string", nullable: true },
            moves: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  playerId: { type: "string" },
                  x: { type: "integer" },
                  y: { type: "integer" },
                  action: { type: "string" },
                  result: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
            lastTickAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        Stats: {
          type: "object",
          properties: {
            winRate: { type: "number", example: 0.75 },
            totalMatches: { type: "integer", example: 20 },
            winCount: { type: "integer", example: 15 },
            loseCount: { type: "integer", example: 5 },
            ranking: { type: "string", example: "Gold" },
          },
        },
        BaseResponse: {
          type: "object",
          properties: {
            status: { type: "integer", example: 200 },
            message: { type: "string", example: "Success" },
            success: { type: "boolean", example: true },
            data: { type: ["object", "array", "string", "number", "boolean", "null"] },
          },
        },
        Friend: {
          type: "object",
          properties: {
            requesterId: { type: "string", example: "642f1e7dc1d3d75b8f89c123" },
            recipientId: { type: "string", example: "642f1e7dc1d3d75b8f89c456" },
            status: { type: "string", enum: ["pending", "accepted", "rejected", "blocked"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        FriendRequest: {
          type: "object",
          properties: {
            recipientId: { type: "string", example: "642f1e7dc1d3d75b8f89c456" },
          },
          required: ["recipientId"],
        },
        FriendResponse: {
          type: "object",
          properties: {
            requesterId: { type: "string", example: "642f1e7dc1d3d75b8f89c123" },
            recipientId: { type: "string", example: "642f1e7dc1d3d75b8f89c456" },
            status: { type: "string", example: "pending" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

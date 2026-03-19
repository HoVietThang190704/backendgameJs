import "dotenv/config";
import dns from "dns";
import dnsPromises from "node:dns/promises";
import http from "http";
import { createApp } from "./app";
import { CorsOptions } from "cors";
import { connectDatabase } from "./lib/database";
import { setupSocketServer } from "./socket/socket";

const PORT = process.env.PORT || 5000;

// Optional: force DNS resolution through Google's resolvers to avoid local SRV issues
if (process.env.FORCE_GOOGLE_DNS === "true") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dnsPromises.setServers(["1.1.1.1", "8.8.8.8"]);
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) ?? [
  'http://localhost:3000',
  'http://localhost:3001',
];

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    console.log('CORS request from origin:', origin);

    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
const app = createApp(corsOptions);
const server = http.createServer(app);

setupSocketServer(server, allowedOrigins);

connectDatabase()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    });

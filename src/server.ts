import "dotenv/config";
import dns from "dns";
import app from "./app";
import cors, { CorsOptions } from "cors";
import { connectDatabase } from "./lib/database";

const PORT = process.env.PORT || 5000;

// Force DNS resolution to go through Google's resolvers to avoid local SRV issues
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) ?? [
  'http://localhost:3000',
  'http://localhost:3001',
];

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
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

app.use(cors(corsOptions));

connectDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    });

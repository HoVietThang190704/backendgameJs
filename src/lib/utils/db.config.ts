export const config = {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/backendgame',
}
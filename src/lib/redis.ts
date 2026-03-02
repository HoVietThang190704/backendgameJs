const redisClient = require('redis').createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
}).on('error', (err: any) => console.log('Redis Client Error', err))
    .connect();

export { redisClient }
import express from 'express';
import setupRoutes from './routes/index';

const app = express();

app.use(express.json());
app.use('/api', setupRoutes());
app.get('/', (_req, res) => res.json({ ok: true, message: 'be-games API' }));

export default app;
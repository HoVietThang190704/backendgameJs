import express from 'express';
import cors, { CorsOptions } from 'cors';
import setupRoutes from './routes/index';

export function createApp(corsOptions?: CorsOptions) {
	const app = express();

	app.use(express.json());

	if (corsOptions) {
		app.use(cors(corsOptions));
	}

	app.use('/api', setupRoutes());
	app.get('/', (_req, res) => res.json({ ok: true, message: 'be-games API' }));

	return app;
}

export default createApp;
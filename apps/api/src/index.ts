import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth';
import { carsRouter } from './routes/cars';
import { servicesRouter } from './routes/services';
import { valuationsRouter } from './routes/valuations';
import { usersRouter } from './routes/users';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:8081',
  ],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/cars', authMiddleware, carsRouter);
app.use('/api/services', authMiddleware, servicesRouter);
app.use('/api/valuations', authMiddleware, valuationsRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚗 Car Tracker API running on port ${PORT}`);
});

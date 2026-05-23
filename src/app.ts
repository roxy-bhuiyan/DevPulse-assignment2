import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.route';
import issuesRoutes from './modules/issues/issues.route';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares -----------------
app.use(cors());
app.use(express.json());

// Health check---------------------
app.get('/', (_req, res) => {
  res.json({ success: true, message: '🚀 DevPulse API is running!' });
});

// Routes------------------------
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

// 404 handler ----------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Global error handler -----------------
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;

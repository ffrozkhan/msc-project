import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import videoAnswerRoutes from './routes/videoAnswerRoutes.js';
import knowledgeGraphRoutes from './routes/knowledgeGraphRoutes.js';

import { generalLimiter, authLimiter, aiLimiter, videoLimiter } from './middleware/rateLimiter.js';
import { sanitize } from './middleware/sanitize.js';
import { securityHeaders } from './middleware/securityHeaders.js';

// ES6 module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Security headers on every response
app.use(securityHeaders);

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize all request bodies
app.use(sanitize);

// General rate limit on all API routes
app.use('/api', generalLimiter);

// Stricter limits on specific route groups
app.use('/api/auth',            authLimiter);
app.use('/api/ai',              aiLimiter);
app.use('/api/video-answers',   videoLimiter);
app.use('/api/knowledge-graph', aiLimiter);

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',            authRoutes);
app.use('/api/documents',       documentRoutes);
app.use('/api/flashcards',      flashcardRoutes);
app.use('/api/ai',              aiRoutes);
app.use('/api/quizzes',         quizRoutes);
app.use('/api/progress',        progressRoutes);
app.use('/api/conversations',   conversationRoutes);
app.use('/api/video-answers',   videoAnswerRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
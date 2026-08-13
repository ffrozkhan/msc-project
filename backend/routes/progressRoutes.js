import express from 'express';
import {
  getDashboard,
  getGlobalDueCount,
  getFlashcardStats
} from '../controllers/progressController.js';
import protect from '../middleware/auth.js';
// import { getFlashcardStats } from '../controllers/progressController.js';
// import { getDashboard, getFlashcardStats, getGlobalDueCount } from '../controllers/progressController.js';


const router = express.Router();

router.get('/due-count', protect, getGlobalDueCount);

router.use(protect);

router.get('/dashboard', getDashboard);

router.get('/flashcard-stats/:setId', protect, getFlashcardStats);

export default router;
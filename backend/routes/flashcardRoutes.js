import express from 'express';
import {
  getFlashcards,
  getAllFlashcardSets,
  reviewFlashcard,
  toggleStarFlashcard,
  deleteFlashcardSet,
  getDueCards
} from '../controllers/flashcardController.js';
import protect from '../middleware/auth.js';
import { validateReview } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllFlashcardSets);
router.get('/due/:documentId', getDueCards);
router.get('/:documentId', getFlashcards);
router.post('/:cardId/review', validateReview, reviewFlashcard);
router.put('/:cardId/star', toggleStarFlashcard);
router.delete('/:id', deleteFlashcardSet);

export default router;
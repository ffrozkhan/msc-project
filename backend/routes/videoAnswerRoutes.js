import express from 'express';
import protect from '../middleware/auth.js';
import { validateVideoSubmit } from '../middleware/validate.js';
import {
  generateQuestion,
  submitAnswer,
  getAnswers,
  deleteAnswer
} from '../controllers/videoAnswerController.js';

const router = express.Router();
router.use(protect);

router.post('/generate-question/:documentId', generateQuestion);
router.post('/submit/:documentId', validateVideoSubmit, submitAnswer);
router.get('/:documentId', getAnswers);
router.delete('/:id', deleteAnswer);

export default router;
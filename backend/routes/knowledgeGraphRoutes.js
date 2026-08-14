import express from 'express';
import protect from '../middleware/auth.js';
import {
  generateGraph,
  getGraph,
  deleteGraph,
} from '../controllers/knowledgeGraphController.js';

const router = express.Router();
router.use(protect);

router.post('/generate/:documentId', generateGraph);
router.get('/:documentId',           getGraph);
router.delete('/:documentId',        deleteGraph);

export default router;
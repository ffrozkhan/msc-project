import express from 'express';
import protect from '../middleware/auth.js';
import { validateMessage, validateTitle } from '../middleware/validate.js';

import {
  getConversations,
  createConversation,
  getConversation,
  sendMessage,
  updateTitle,
  deleteConversation
} from '../controllers/conversationController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getConversations)
  .post(createConversation);

router.route('/:id')
  .get(getConversation)
  .delete(deleteConversation);

router.patch('/:id/title',   validateTitle,   updateTitle);
router.post('/:id/message',  validateMessage, sendMessage);

export default router;
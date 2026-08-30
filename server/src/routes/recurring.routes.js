import express from 'express';
import { getRecurringTransactions, deleteRecurringTransaction } from '../controllers/recurring.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.route('/')
  .get(getRecurringTransactions);

router.route('/:id')
  .delete(deleteRecurringTransaction);

export default router;

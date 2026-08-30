import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from '../controllers/savings.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.route('/')
  .get(getSavingsGoals)
  .post(createSavingsGoal);

router.route('/:id')
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

export default router;

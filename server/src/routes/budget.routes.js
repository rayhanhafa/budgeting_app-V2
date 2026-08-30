import express from 'express';
import { setBudget, getBudgetProgress } from '../controllers/budget.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', setBudget);
router.get('/progress', getBudgetProgress);

export default router;

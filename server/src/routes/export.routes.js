import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import { exportTransactionsToCSV } from '../controllers/export.controller.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', exportTransactionsToCSV);

export default router;

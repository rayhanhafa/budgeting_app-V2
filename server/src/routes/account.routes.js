import express from 'express';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/account.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.get('/', getAccounts);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;

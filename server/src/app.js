import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js';
import categoryRoutes from './routes/category.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import savingsRoutes from './routes/savings.routes.js';
import exportRoutes from './routes/export.routes.js';
import recurringRoutes from './routes/recurring.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/recurring', recurringRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export default app;

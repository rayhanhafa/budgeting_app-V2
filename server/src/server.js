import 'dotenv/config';
import app from './app.js';
import { startRecurringTransactionsCron } from './cron/recurring.js';

const PORT = process.env.PORT || 5000;

// Start cron jobs
startRecurringTransactionsCron();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

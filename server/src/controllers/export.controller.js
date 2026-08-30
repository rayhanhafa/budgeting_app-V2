import prisma from '../prisma/client.js';
import { Parser } from 'json2csv';

export const exportTransactionsToCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = { userId: req.user.id };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = { gte: new Date(startDate) };
    } else if (endDate) {
      whereClause.date = { lte: new Date(endDate) };
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
        account: true,
        toAccount: true,
      },
      orderBy: { date: 'desc' },
    });

    const formattedData = transactions.map(tx => ({
      ID: tx.id,
      Date: new Date(tx.date).toLocaleDateString('id-ID'),
      Type: tx.type,
      Account: tx.account?.name || '',
      ToAccount: tx.toAccount?.name || '',
      Category: tx.category?.name || '',
      Amount: Number(tx.amount),
      Note: tx.note || ''
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(formattedData.length > 0 ? formattedData : [{ Message: 'No transactions found' }]);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

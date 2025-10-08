import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { db } from '@/lib/db';
import { formatter } from '@/lib/utils';
import { TransactionColumn } from './columns';
import { Transactions } from './transactions';

interface TransactionsListProps {
  isBlocked: boolean;
}

const TransactionsList = async ({ isBlocked }: TransactionsListProps) => {
  const timeZone = 'Asia/Kolkata';

  const transactions = await db.transaction.findMany({
    where: {
      OR: [
        { description: { contains: 'deposit' } },
        { description: { contains: 'withdrawal' } },
        { category: 'transaction' }
      ]
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedTransactions: TransactionColumn[] = transactions.map((item) => {
    const zonedTime = toZonedTime(item.createdAt, timeZone);
    return {
      id: item.id,
      amount: `${item.type === 'deposit' ? '+' : '-'} ${formatter.format(Number(item.amount))}`,
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase(),
      createdAt: format(zonedTime, 'MMMM do yyyy HH:mm'),
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Transactions data={formattedTransactions} isBlocked={isBlocked} />
    </div>
  );
};

export default TransactionsList;

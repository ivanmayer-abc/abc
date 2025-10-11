import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { db } from '@/lib/db';
import { formatter } from '@/lib/utils';
import { SlotTransactionColumn } from './columns';
import { Transactions } from './transactions';

interface HistoryListProps {
  isBlocked: boolean;
}

const SlotsList = async ({ isBlocked }: HistoryListProps) => {
  const timeZone = 'Asia/Kolkata';

  const transactions = await db.transaction.findMany({
    where: {
    NOT: [
      { category: "transaction" }
    ]
  },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formattedTransactions: SlotTransactionColumn[] = transactions.map((item) => {
    const zonedTime = toZonedTime(item.createdAt, timeZone);
    return {
      id: item.id,
      amount: `${item.type === 'deposit' ? '+' : '-'} ${formatter.format(Number(item.amount))}`,
      status: item.status,
      createdAt: format(zonedTime, 'dd MMM yyyy HH:mm'),
      description: item.description || '',
    };
  });

return (
    <div className="sm:container px-1 m:py-6 space-y-6 pb-[60px] lg:pb-0">
      <Transactions 
        data={formattedTransactions} 
        isBlocked={isBlocked}
      />
    </div>
  );
};

export default SlotsList;
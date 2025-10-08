import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { db } from '@/lib/db';
import { formatter } from '@/lib/utils';
import { SlotTransactionColumn } from './columns';
import { Transactions } from './transactions';

const SlotsList = async () => {
  const timeZone = 'Asia/Kolkata';

  const transactions = await db.transaction.findMany({
    where: {
      OR: [
        { description: { contains: 'slot' } },
        { description: { contains: 'spin' } },
        { description: { contains: 'win' } },
        { category: 'slots' }
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
      createdAt: format(zonedTime, 'MMMM do yyyy HH:mm'),
      description: item.description || '',
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Transactions data={formattedTransactions} />
    </div>
  );
};

export default SlotsList;
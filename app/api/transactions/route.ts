import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where: { 
          userId: user.id,
          OR: [
            { description: { contains: 'deposit' } },
            { description: { contains: 'withdrawal' } },
            { category: 'transaction' }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          createdAt: true,
          description: true,
          category: true
        }
      }),
      db.transaction.count({
        where: { 
          userId: user.id,
          OR: [
            { description: { contains: 'deposit' } },
            { description: { contains: 'withdrawal' } },
            { category: 'transaction' }
          ]
        }
      })
    ]);

    const balanceAggregates = await db.transaction.groupBy({
      by: ['status', 'type'],
      where: { userId: user.id },
      _sum: { amount: true },
      _count: { id: true }
    });

    let availableBalance = 0;
    let netPending = 0;

    balanceAggregates.forEach(agg => {
      const amount = agg._sum.amount?.toNumber() || 0;
      
      if (agg.status === 'success') {
        availableBalance += agg.type === 'deposit' ? amount : -amount;
      } else if (agg.status === 'pending') {
        netPending += agg.type === 'deposit' ? amount : -amount;
      }
    });

    return NextResponse.json({ 
      transactions,
      balance: {
        available: availableBalance,
        netPending, 
        effective: availableBalance
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.log('[TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { amount, type, description, category } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        amount,
        type,
        description: description || `Slot machine ${type}`,
        category: category || 'slots',
        status: 'success'
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTIONS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
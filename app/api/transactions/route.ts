import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { createTransactionWithCommissions } from '@/lib/commission-processor';

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

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await createTransactionWithCommissions(
        user.id,
        amount,
        type,
        description || `${type} transaction`,
        category || (type === 'withdrawal' ? 'withdrawal' : 'deposit')
      );

      if (type === 'deposit' && category === 'transaction') {
        const pendingDepositBonuses = await tx.bonus.findMany({
          where: {
            userId: user.id,
            type: { in: ['DEPOSIT_BONUS', 'COMBINED'] },
            status: 'PENDING_ACTIVATION'
          },
          include: {
            promoCode: true
          }
        });

        for (const bonus of pendingDepositBonuses) {
          const depositAmount = amount;
          const minDepositAmount = bonus.promoCode?.minDepositAmount?.toNumber() || 0;
          
          if (depositAmount >= minDepositAmount) {
            const bonusPercentage = bonus.promoCode?.bonusPercentage || 0;
            const maxBonusAmount = bonus.promoCode?.maxBonusAmount?.toNumber() || 0;
            
            let bonusAmount = depositAmount * (bonusPercentage / 100);
            
            if (maxBonusAmount > 0 && bonusAmount > maxBonusAmount) {
              bonusAmount = maxBonusAmount;
            }

            await tx.bonus.update({
              where: { id: bonus.id },
              data: {
                amount: depositAmount,
                bonusAmount: bonusAmount,
                remainingAmount: bonusAmount,
                status: 'PENDING_WAGERING',
                activatedAt: new Date()
              }
            });

            await tx.transaction.create({
              data: {
                userId: user.id,
                type: 'deposit',
                amount: bonusAmount,
                status: 'success',
                description: `Bonus credit from ${bonus.promoCode?.code || 'promo code'}`,
                category: 'bonus'
              }
            });
          }
        }
      }

      return newTransaction;
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTIONS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

async function calculateUserBalance(userId: string): Promise<number> {
  const transactions = await db.transaction.findMany({
    where: { 
      userId: userId, 
      status: 'success'
    }
  })

  return transactions.reduce((sum, transaction) => {
    const transactionAmount = transaction.amount.toNumber ? transaction.amount.toNumber() : Number(transaction.amount)
    
    if (transaction.type === 'deposit') {
      return sum + transactionAmount
    } else if (transaction.type === 'withdrawal') {
      return sum - Math.abs(transactionAmount)
    }
    return sum
  }, 0)
}

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let body
    try {
      const text = await req.text()
      
      if (!text) {
        return new NextResponse("Empty request body", { status: 400 })
      }

      body = JSON.parse(text)
    } catch (parseError) {
      return new NextResponse("Invalid JSON", { status: 400 })
    }
    
    const { outcomeId, amount, odds } = body

    if (!outcomeId || typeof outcomeId !== 'string') {
      return new NextResponse("Valid outcome ID is required", { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
      return new NextResponse("Valid bet amount is required", { status: 400 })
    }

    if (typeof odds !== 'number' || odds < 1.01 || isNaN(odds)) {
      return new NextResponse("Valid odds are required", { status: 400 })
    }

    const availableBalance = await calculateUserBalance(user.id)

    if (amount > availableBalance) {
      return new NextResponse(`Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`, { status: 400 })
    }

    const outcome = await db.outcome.findFirst({
      where: {
        id: outcomeId,
        result: 'PENDING',
        event: {
          status: {
            in: ['UPCOMING', 'LIVE']
          },
          book: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        event: {
          include: {
            book: true
          }
        }
      }
    })

    if (!outcome) {
      return new NextResponse("Outcome not available for betting", { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const bet = await tx.bet.create({
        data: {
          userId: user.id,
          bookId: outcome.event.book.id,
          eventId: outcome.event.id,
          outcomeId: outcome.id,
          amount,
          odds,
          potentialWin: amount * odds,
          status: 'PENDING'
        }
      })

      await tx.outcome.update({
        where: { id: outcomeId },
        data: {
          stake: {
            increment: amount
          }
        }
      })

      const withdrawalTx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'withdrawal',
          amount: amount,
          status: 'success',
          description: `Bet placed on ${outcome.event.name} - ${outcome.name}`,
          category: 'betting-stake'
        }
      })

      const potentialWinTx = await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'deposit',
          amount: amount * odds,
          status: 'pending',
          description: `Potential winnings: ${outcome.event.name} - ${outcome.name}`,
          category: 'betting-winnings'
        }
      })

      await tx.bet.update({
        where: { id: bet.id },
        data: {
          transactionId: potentialWinTx.id
        }
      })

      return { bet, withdrawalTx, potentialWinTx }
    })

    return NextResponse.json(result.bet)

  } catch (error: any) {
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    const bets = await db.bet.findMany({
      where: {
        userId: user.id,
        ...(bookId && { bookId })
      },
      include: {
        outcome: {
          select: {
            name: true,
            id: true
          }
        },
        event: {
          select: {
            name: true,
            id: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            date: true,
            category: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const betsWithBookStatus = bets.map(bet => {
      const now = new Date()
      const bookDate = new Date(bet.book.date)
      
      const isLive = bet.book.status === 'ACTIVE' && now >= bookDate
      const isUpcoming = bet.book.status === 'ACTIVE' && now < bookDate
      
      return {
        ...bet,
        book: {
          ...bet.book,
          isLive,
          isUpcoming,
          displayStatus: bet.book.status === 'ACTIVE' 
            ? (now >= bookDate ? 'LIVE' : 'UPCOMING')
            : bet.book.status
        }
      }
    })

    return NextResponse.json(betsWithBookStatus)
  } catch (error) {
    console.log('[CLIENT_BETS_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
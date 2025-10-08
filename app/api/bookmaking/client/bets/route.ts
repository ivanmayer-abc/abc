import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

// Helper function to calculate available balance
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
      console.log('❌ Unauthorized: No user ID')
      return new NextResponse("Unauthorized", { status: 401 })
    }

    console.log('📥 Received bet request from user:', user.id)

    let body
    try {
      const text = await req.text()
      console.log('📦 Raw request body:', text)
      
      if (!text) {
        return new NextResponse("Empty request body", { status: 400 })
      }

      body = JSON.parse(text)
      console.log('📦 Parsed request body:', body)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return new NextResponse("Invalid JSON", { status: 400 })
    }
    
    const { outcomeId, amount, odds } = body

    console.log('🔍 Extracted values:', { 
      outcomeId, 
      amount, 
      odds, 
      amountType: typeof amount, 
      oddsType: typeof odds 
    })

    // Validate required fields
    if (!outcomeId || typeof outcomeId !== 'string') {
      console.log('❌ Invalid outcomeId:', outcomeId)
      return new NextResponse("Valid outcome ID is required", { status: 400 })
    }

    if (typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
      console.log('❌ Invalid amount:', amount)
      return new NextResponse("Valid bet amount is required", { status: 400 })
    }

    if (typeof odds !== 'number' || odds < 1.01 || isNaN(odds)) {
      console.log('❌ Invalid odds:', odds)
      return new NextResponse("Valid odds are required", { status: 400 })
    }

    console.log('✅ All validations passed, checking balance...')

    // Calculate user balance
    const availableBalance = await calculateUserBalance(user.id)
    console.log(`💰 User ${user.id} balance: ₹${availableBalance}, bet amount: ₹${amount}`)

    if (amount > availableBalance) {
      console.log(`❌ Insufficient balance: ${availableBalance} < ${amount}`)
      return new NextResponse(`Insufficient balance. Available: ₹${availableBalance.toFixed(2)}`, { status: 400 })
    }

    // Verify outcome is available for betting
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
      console.log('❌ Outcome not available:', outcomeId)
      return new NextResponse("Outcome not available for betting", { status: 400 })
    }

    console.log('✅ Outcome verified, creating bet...')

    // Create bet and transactions...
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

      console.log(`✅ Bet created: ${bet.id}`)

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

      console.log(`💸 Withdrawal created: ${withdrawalTx.id} for ₹${amount}`)

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

      console.log(`📝 Pending deposit created: ${potentialWinTx.id} for ₹${amount * odds}`)

      await tx.bet.update({
        where: { id: bet.id },
        data: {
          transactionId: potentialWinTx.id
        }
      })

      return { bet, withdrawalTx, potentialWinTx }
    })

    console.log('🎉 Bet placement completed successfully')
    return NextResponse.json(result.bet)

  } catch (error: any) {
    console.error('❌ [CLIENT_BETS_POST] Unexpected error:', error)
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

    // Add display status to books
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = params

    // Check if bet exists and belongs to user
    const bet = await db.bet.findFirst({
      where: {
        id,
        userId: user.id,
        status: 'PENDING'
      },
      include: {
        book: true,
        outcome: true,
        event: true
      }
    })

    if (!bet) {
      return new NextResponse("Bet not found or cannot be cancelled", { status: 404 })
    }

    // Check if book hasn't started yet
    const now = new Date()
    const bookDate = new Date(bet.book.date)
    if (now >= bookDate) {
      return new NextResponse("Cannot cancel bet after book has started", { status: 400 })
    }

    // Cancel the bet and related transactions in a single transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Update bet status to CANCELLED
      const updatedBet = await tx.bet.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          settledAt: new Date()
        }
      })

      console.log(`✅ Bet ${id} cancelled`)

      // 2. Find the withdrawal transaction (the stake amount that was deducted)
      const withdrawalTransaction = await tx.transaction.findFirst({
        where: {
          userId: user.id,
          type: 'withdrawal',
          amount: bet.amount,
          description: `Bet placed on ${bet.event.name} - ${bet.outcome.name}`,
          status: 'success'
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // 3. Find the pending deposit transaction (potential winnings)
      const pendingDepositTransaction = await tx.transaction.findFirst({
        where: {
          id: bet.transactionId || undefined,
          userId: user.id,
          type: 'deposit',
          status: 'pending'
        }
      })

      // 4. Create a refund deposit transaction to return the stake
      if (withdrawalTransaction) {
        const refundTransaction = await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'deposit',
            amount: bet.amount,
            status: 'success',
            description: `Bet cancellation refund: ${bet.event.name} - ${bet.outcome.name}`,
            category: 'betting-refund'
          }
        })
        console.log(`💰 Refund transaction created: ₹${bet.amount}`)
      }

      // 5. Update the pending deposit transaction to cancelled
      if (pendingDepositTransaction) {
        await tx.transaction.update({
          where: { id: pendingDepositTransaction.id },
          data: {
            status: 'fail',
            description: `Cancelled: ${pendingDepositTransaction.description}`
          }
        })
        console.log(`❌ Pending winnings transaction cancelled`)
      }

      // 6. Decrease the outcome stake
      await tx.outcome.update({
        where: { id: bet.outcomeId },
        data: {
          stake: {
            decrement: bet.amount
          }
        }
      })

      console.log(`📉 Outcome stake decreased by: ₹${bet.amount}`)

      return {
        bet: updatedBet,
        refundAmount: bet.amount
      }
    })

    return NextResponse.json({
      message: 'Bet cancelled successfully',
      refundAmount: result.refundAmount
    })

  } catch (error) {
    console.log('[CLIENT_BETS_DELETE]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
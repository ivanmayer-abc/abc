// app/api/bookmaking/client/bets/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

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

      // 4. Update the withdrawal transaction to cancelled instead of creating refund
      if (withdrawalTransaction) {
        await tx.transaction.update({
          where: { id: withdrawalTransaction.id },
          data: {
            status: 'fail',
            description: `Cancelled: ${withdrawalTransaction.description}`
          }
        })
        console.log(`❌ Withdrawal transaction cancelled: ₹${bet.amount}`)
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
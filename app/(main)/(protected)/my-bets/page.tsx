// app/my-bets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, X, Calendar, BookOpen } from 'lucide-react'
import { formatter } from '@/lib/utils'
import Link from 'next/link'
import { useBalanceContext } from '@/contexts/balance-context'
import { toast } from 'sonner'

interface UserBet {
  id: string
  amount: number
  potentialWin: number
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED'
  odds: number
  createdAt: Date
  settledAt?: Date
  outcome: {
    name: string
    id: string
  }
  event: {
    name: string
    id: string
  }
  book: {
    id: string
    title: string
    date: Date
    category: string
    status: string
    isLive?: boolean
    isUpcoming?: boolean
    displayStatus?: string
  }
}

export default function MyBetsPage() {
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
  const { refreshBalance } = useBalanceContext();

  useEffect(() => {
    fetchUserBets()
  }, [])

  const fetchUserBets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bookmaking/client/bets')
      if (response.ok) {
        const betsData: UserBet[] = await response.json()
        setUserBets(betsData)
      }
    } catch (error) {
      console.error('Error fetching user bets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBet = async (betId: string) => {
    const cancelPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/bookmaking/client/bets/${betId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await refreshBalance();
          fetchUserBets()
          resolve('Bet cancelled successfully')
        } else {
          const errorData = await response.json()
          reject(errorData.message || 'Failed to cancel bet')
        }
      } catch (error) {
        console.error('Error cancelling bet:', error)
        reject('Error cancelling bet')
      }
    })

    toast.promise(cancelPromise, {
      loading: 'Cancelling bet...',
      success: (message) => message as string,
      error: (error) => error as string,
    })
  }

  // Filter bets based on selected filter
  const filteredBets = userBets.filter(bet => {
    if (filter === 'all') return true
    if (filter === 'pending') return bet.status === 'PENDING'
    if (filter === 'won') return bet.status === 'WON'
    if (filter === 'lost') return bet.status === 'LOST'
    return true
  })

  // Calculate total stats for user bets
  const calculateBetStats = () => {
    const totalBets = userBets.length
    const totalStaked = userBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalPotentialWin = userBets
      .filter(bet => bet.status === 'PENDING')
      .reduce((sum, bet) => sum + bet.potentialWin, 0)
    const totalWon = userBets
      .filter(bet => bet.status === 'WON')
      .reduce((sum, bet) => sum + (bet.potentialWin - bet.amount), 0)
    const totalLost = userBets
      .filter(bet => bet.status === 'LOST')
      .reduce((sum, bet) => sum + bet.amount, 0)
    const netProfit = totalWon - totalLost

    return { totalBets, totalStaked, totalPotentialWin, totalWon, totalLost, netProfit }
  }

  const betStats = calculateBetStats()

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/book">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">My Bets</h1>
        </div>
      </div>

      {/* Bet Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{betStats.totalBets}</div>
            <div className="text-sm text-muted-foreground">Total Bets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formatter.format(betStats.totalStaked)}</div>
            <div className="text-sm text-muted-foreground">Total Staked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatter.format(betStats.totalPotentialWin)}</div>
            <div className="text-sm text-muted-foreground">Potential Win</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatter.format(betStats.totalWon)}</div>
            <div className="text-sm text-muted-foreground">Total Won</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{formatter.format(betStats.totalLost)}</div>
            <div className="text-sm text-muted-foreground">Total Lost</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              betStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatter.format(betStats.netProfit)}
            </div>
            <div className="text-sm text-muted-foreground">Net Profit</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Bets
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'won' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('won')}
        >
          Won
        </Button>
        <Button
          variant={filter === 'lost' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('lost')}
        >
          Lost
        </Button>
      </div>

      {/* Bets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Bets' :
             filter === 'pending' ? 'Pending Bets' :
             filter === 'won' ? 'Won Bets' : 'Lost Bets'}
          </CardTitle>
          <CardDescription>
            {filteredBets.length} {filteredBets.length === 1 ? 'bet' : 'bets'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bets found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBets.map((bet) => {
                const isBookAcceptingBets = new Date() < new Date(bet.book.date)
                const bookStatus = bet.book.displayStatus || (bet.book.isLive ? 'LIVE' : bet.book.isUpcoming ? 'UPCOMING' : bet.book.status)
                
                return (
                  <Card key={bet.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/book/${bet.book.id}`}>
                            <h4 className="font-semibold hover:text-primary cursor-pointer">
                              {bet.book.title}
                            </h4>
                          </Link>
                          <Badge variant="secondary" className="text-xs">
                            {bet.book.category}
                          </Badge>
                          <Badge variant={
                            bookStatus === 'LIVE' ? 'default' : 
                            bookStatus === 'UPCOMING' ? 'secondary' : 'outline'
                          } className="text-xs">
                            {bookStatus.toLowerCase()}
                          </Badge>
                          <Badge variant={
                            bet.status === 'PENDING' ? 'secondary' :
                            bet.status === 'WON' ? 'default' :
                            bet.status === 'LOST' ? 'destructive' : 'outline'
                          }>
                            {bet.status.toLowerCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Event:</span> {bet.event.name}
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Outcome:</span> {bet.outcome.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span>Stake: {formatter.format(bet.amount)}</span>
                          <span>Odds: {bet.odds.toFixed(2)}</span>
                          <span>Potential Win: {formatter.format(bet.potentialWin)}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Placed: {new Date(bet.createdAt).toLocaleString()}
                          </span>
                          {bet.settledAt && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              Settled: {new Date(bet.settledAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {bet.status === 'PENDING' && isBookAcceptingBets && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBet(bet.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {bet.status === 'WON' && (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        )}
                        {bet.status === 'LOST' && (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      
      {/* Statistics Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      {/* Filter Skeletons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Bets List Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
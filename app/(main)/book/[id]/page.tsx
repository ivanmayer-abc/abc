// app/book/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Trophy, Users, Calendar, Eye, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import BettingSlipWrapper from '@/components/bookmaking/betting-slip-wrapper'
import { formatter } from '@/lib/utils'
import Link from 'next/link'
import { useBalanceContext } from '@/contexts/balance-context'
import { toast } from 'sonner'

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

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
}

interface OutcomeWithUserStake {
  id: string
  name: string
  odds: number
  probability: number
  stake: number
  result: 'PENDING' | 'WIN' | 'LOSE' | 'VOID'
  eventId: string
  userStake?: number // User's personal stake on this outcome
}

export default function BookPage() {
  const params = useParams()
  const bookId = params.id as string
  
  const [book, setBook] = useState<Book | null>(null)
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'events' | 'my-bets'>('events')
  const { refreshBalance } = useBalanceContext();

  useEffect(() => {
    if (bookId) {
      fetchBook()
      fetchUserBets()
    }
  }, [bookId])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bookmaking/client/books/${bookId}`)
      if (response.ok) {
        const bookData: Book = await response.json()
        setBook(bookData)
      }
    } catch (error) {
      console.error('Error fetching book:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBets = async () => {
    try {
      const response = await fetch(`/api/bookmaking/client/bets?bookId=${bookId}`)
      if (response.ok) {
        const betsData: UserBet[] = await response.json()
        setUserBets(betsData)
      }
    } catch (error) {
      console.error('Error fetching user bets:', error)
    }
  }

  // Add user stake information to outcomes
  const getOutcomesWithUserStake = () => {
    if (!book?.events) return []

    return book.events.map(event => ({
      ...event,
      outcomes: event.outcomes.map(outcome => ({
        ...outcome,
        userStake: userBets
          .filter(bet => bet.outcome.id === outcome.id && bet.status === 'PENDING')
          .reduce((total, bet) => total + bet.amount, 0)
      }))
    }))
  }

  const handleOutcomeClick = (outcome: any, event: any) => {
    // Check if book date hasn't started yet
    const now = new Date()
    const bookDate = new Date(book?.date || '')
    
    if (now >= bookDate) {
      toast.error('Bets are no longer accepted for this book as the event has already started.')
      return
    }

    setSelectedOutcome({
      id: outcome.id,
      name: outcome.name,
      odds: outcome.odds,
      eventName: event.name,
      bookTitle: book?.title || 'Book'
    })
    setIsSlipOpen(true)
  }

  const handleBetPlaced = () => {
    setIsSlipOpen(false)
    setSelectedOutcome(null)
    fetchBook()
    fetchUserBets()
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

  // Check if book is accepting bets (date hasn't started)
  const isAcceptingBets = () => {
    if (!book) return false
    const now = new Date()
    const bookDate = new Date(book.date)
    return now < bookDate
  }

  // Check if book is live
  const isBookLive = () => {
    if (!book) return false
    const now = new Date()
    const bookDate = new Date(book.date)
    return now >= bookDate && book.status === 'ACTIVE'
  }

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

    return { totalBets, totalStaked, totalPotentialWin, totalWon, totalLost }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!book) {
    return (
      <div className="container mx-auto py-6">
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Book not found</h3>
            <p className="text-muted-foreground mb-4">
              The book you&apos;re looking for doesn&apos;t exist or is no longer available.
            </p>
            <Link href="/book">
              <Button variant="outline">
                Back to Books
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookStatus = book.displayStatus || (isBookLive() ? 'LIVE' : book.isLive ? 'LIVE' : 'UPCOMING')
  const eventsWithUserStake = getOutcomesWithUserStake()
  const acceptingBets = isAcceptingBets()
  const bookLive = isBookLive()
  const betStats = calculateBetStats()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/book">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </Link>
        <Link href="/my-bets">
          <Button variant="outline" size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            View All My Bets
          </Button>
        </Link>
      </div>

      {/* Book Header */}
      <Card>
        <CardContent className="p-6">
          {/* Category */}
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm">
              {book.category}
            </Badge>
          </div>

          {/* Book Name and Status */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={
                bookLive ? 'default' : 
                bookStatus === 'UPCOMING' ? 'secondary' : 'outline'
              } className="text-sm">
                {bookLive ? 'LIVE' : bookStatus.charAt(0).toUpperCase() + bookStatus.slice(1).toLowerCase()}
              </Badge>
              {!acceptingBets && (
                <Badge variant="outline" className="text-sm bg-destructive/20 text-destructive">
                  Bets Closed
                </Badge>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <Calendar className="h-4 w-4" />
            <span>{new Date(book.date).toLocaleString()}</span>
          </div>

          <Separator className="mb-6" />

          {/* Teams Section */}
          {book.teams && book.teams.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams
              </h2>
              <div className="flex flex-wrap gap-8 justify-center">
                {book.teams.map((team, index) => (
                  <div key={team.id} className="flex flex-col items-center">
                    {team.image && (
                      <img 
                        src={team.image} 
                        alt={team.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-muted mb-2"
                      />
                    )}
                    <span className="font-medium text-center">{team.name}</span>
                    {index < book.teams.length - 1 && (
                      <div className="hidden md:block absolute transform translate-x-16">
                        <span className="text-xl font-bold text-muted-foreground">vs</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Mobile VS indicators */}
              <div className="flex justify-center gap-4 mt-4 md:hidden">
                {book.teams.slice(0, -1).map((_, index) => (
                  <span key={index} className="text-lg font-bold text-muted-foreground">vs</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b">
        <Button
          variant="ghost"
          className={`rounded-none border-b-2 ${activeTab === 'events' ? 'border-primary' : 'border-transparent'}`}
          onClick={() => setActiveTab('events')}
        >
          Events & Betting
        </Button>
        <Button
          variant="ghost"
          className={`rounded-none border-b-2 ${activeTab === 'my-bets' ? 'border-primary' : 'border-transparent'}`}
          onClick={() => setActiveTab('my-bets')}
        >
          My Bets ({userBets.length})
        </Button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle>Events & Betting Options</CardTitle>
            <CardDescription>
              {acceptingBets 
                ? 'Choose an event and place your bet on the desired outcome'
                : bookLive 
                  ? 'Event is LIVE - Bets are no longer accepted'
                  : 'Bets are no longer accepted for this book as the event has started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {eventsWithUserStake.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active events in this book at the moment.</p>
              </div>
            ) : (
              eventsWithUserStake.map((event, index) => (
                <div key={event.id} className="space-y-4">
                  {index > 0 && <Separator />}
                  
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{event.name}</h3>
                          {(event.isFirstFastOption || event.isSecondFastOption) && (
                            <Badge variant="outline" className="bg-yellow-50">
                              {event.isFirstFastOption ? '1st Fast Bet' : '2nd Fast Bet'}
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Event-specific teams if available */}
                    {event.homeTeam && event.awayTeam && (
                      <div className="flex items-center justify-center gap-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          {event.homeTeam.image && (
                            <img 
                              src={event.homeTeam.image} 
                              alt={event.homeTeam.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-muted"
                            />
                          )}
                          <span className="font-medium text-center">{event.homeTeam.name}</span>
                        </div>
                        <span className="text-xl font-bold text-muted-foreground">vs</span>
                        <div className="flex flex-col items-center gap-2">
                          {event.awayTeam.image && (
                            <img 
                              src={event.awayTeam.image} 
                              alt={event.awayTeam.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-muted"
                            />
                          )}
                          <span className="font-medium text-center">{event.awayTeam.name}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {event.outcomes.map((outcome) => (
                        <Button
                          key={outcome.id}
                          variant="outline"
                          className={`h-auto py-6 px-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 group ${
                            acceptingBets 
                              ? 'hover:bg-primary/5 hover:border-primary/20 cursor-pointer' 
                              : 'cursor-not-allowed opacity-60'
                          }`}
                          onClick={() => acceptingBets && handleOutcomeClick(outcome, event)}
                          disabled={!acceptingBets}
                        >
                          <div className={`font-semibold text-base text-center ${
                            acceptingBets ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'
                          }`}>
                            {outcome.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold px-3 py-1 rounded-md ${
                              acceptingBets ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted'
                            }`}>
                              {outcome.odds.toFixed(2)}
                            </span>
                          </div>
                          {/* Show user's stake only if they have bet on this outcome */}
                          {outcome.userStake > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              Your Stake: {formatter.format(outcome.userStake)}
                            </div>
                          )}
                        </Button>
                      ))}
                    </div>
                    {!acceptingBets && (
                      <div className="text-center text-sm text-muted-foreground italic">
                        {bookLive ? 'Event is LIVE - Bets are closed' : 'Bets are no longer accepted for this event'}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* My Bets Tab */}
      {activeTab === 'my-bets' && (
        <Card>
          <CardHeader>
            <CardTitle>My Bets</CardTitle>
            <CardDescription>
              View your betting history and manage active bets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Bet Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
            </div>

            {/* Bets List */}
            {userBets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>You haven&apos;t placed any bets on this book yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userBets.map((bet) => (
                  <Card key={bet.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{bet.event.name}</h4>
                          <Badge variant={
                            bet.status === 'PENDING' ? 'secondary' :
                            bet.status === 'WON' ? 'default' :
                            bet.status === 'LOST' ? 'destructive' : 'outline'
                          }>
                            {bet.status.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Outcome: {bet.outcome.name}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Stake: {formatter.format(bet.amount)}</span>
                          <span>Odds: {bet.odds.toFixed(2)}</span>
                          <span>Potential Win: {formatter.format(bet.potentialWin)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Placed: {new Date(bet.createdAt).toLocaleString()}
                          {bet.settledAt && ` • Settled: ${new Date(bet.settledAt).toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {bet.status === 'PENDING' && acceptingBets && (
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <BettingSlipWrapper
        isOpen={isSlipOpen}
        onClose={() => {
          setIsSlipOpen(false)
          setSelectedOutcome(null)
        }}
        outcome={selectedOutcome}
        onBetPlaced={handleBetPlaced}
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Separator />
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
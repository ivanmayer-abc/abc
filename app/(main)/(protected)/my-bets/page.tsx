'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { TrendingUp, TrendingDown, X, ArrowRight, IndianRupee } from 'lucide-react'
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

const ITEMS_PER_PAGE = 10

export default function MyBetsPage() {
  const [userBets, setUserBets] = useState<UserBet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
  const [cancellingBets, setCancellingBets] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
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
    setCancellingBets(prev => new Set(prev).add(betId));
    
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
      } finally {
        setCancellingBets(prev => {
          const newSet = new Set(prev);
          newSet.delete(betId);
          return newSet;
        });
      }
    })

    toast.promise(cancelPromise, {
      loading: 'Cancelling bet...',
      success: (message) => message as string,
      error: (error) => error as string,
    })
  }

  const filteredBets = userBets.filter(bet => {
    if (filter === 'all') return true
    if (filter === 'pending') return bet.status === 'PENDING'
    if (filter === 'won') return bet.status === 'WON'
    if (filter === 'lost') return bet.status === 'LOST'
    return true
  })

  const totalPages = Math.ceil(filteredBets.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentBets = filteredBets.slice(startIndex, endIndex)

  const calculateBetStats = () => {
    const totalBets = userBets.length
    const totalStaked = userBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalPotentialWin = userBets
      .filter(bet => bet.status === 'PENDING')
      .reduce((sum, bet) => sum + bet.potentialWin, 0)
    const totalWon = userBets
      .filter(bet => bet.status === 'WON')
      .reduce((sum, bet) => sum + (bet.potentialWin), 0)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 w-full justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My bets</h1>
          <Link href="/book">
            <Button variant="outline" size="sm">
              Go to events
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{betStats.totalBets}</div>
            <div className="text-sm text-muted-foreground">Total Bets</div>
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
            <div className="text-2xl font-bold text-blue-600">{formatter.format(betStats.totalPotentialWin)}</div>
            <div className="text-sm text-muted-foreground">Potential Win</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('all')
            setCurrentPage(1)
          }}
        >
          All Bets
        </Button>
        <Button
          variant={filter === 'won' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('won')
            setCurrentPage(1)
          }}
        >
          Won
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('pending')
            setCurrentPage(1)
          }}
        >
          Pending
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Bets' :
             filter === 'pending' ? 'Pending Bets' :
             filter === 'won' ? 'Won Bets' : 'Lost Bets'}
          </CardTitle>
          <CardDescription>
            Showing {currentBets.length} of {filteredBets.length} {filteredBets.length === 1 ? 'bet' : 'bets'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bets found for the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='pl-4'>Event</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Stake</TableHead>
                      <TableHead>Odds</TableHead>
                      <TableHead>Potential Win</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentBets.map((bet) => {
                      const isBookAcceptingBets = new Date() < new Date(bet.book.date)
                      const bookStatus = bet.book.displayStatus || (bet.book.isLive ? 'LIVE' : bet.book.isUpcoming ? 'UPCOMING' : bet.book.status)
                      
                      return (
                        <TableRow key={bet.id}>
                          <TableCell>
                            <div className="flex flex-col space-y-1 pl-2">
                              {bet.book.status === "ACTIVE" ? (
                                <Link href={`/book/${bet.book.id}`}>
                                  <div className="font-medium hover:text-primary cursor-pointer">
                                    {bet.book.title}
                                  </div>
                                </Link>
                                ) : (
                                  <div className="font-medium hover:text-primary">
                                    {bet.book.title}
                                  </div>
                                )}
                              <div className="text-sm text-muted-foreground">
                                {bet.event.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {bet.book.category}
                                </Badge>
                                <Badge variant={
                                  bookStatus === 'LIVE' ? 'default' : 
                                  bookStatus === 'UPCOMING' ? 'secondary' : 'outline'
                                } className="text-xs">
                                  {bookStatus.toLowerCase()}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{bet.outcome.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatter.format(bet.amount)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{bet.odds.toFixed(2)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-blue-600">
                              {formatter.format(bet.potentialWin)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              bet.status === 'PENDING' ? 'secondary' :
                              bet.status === 'WON' ? 'default' :
                              bet.status === 'LOST' ? 'destructive' : 'outline'
                            }>
                              {bet.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(bet.book.date).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                year: 'numeric',
                                month: 'long',
                                day: '2-digit',
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(bet.book.date).toLocaleTimeString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {bet.status === 'PENDING' && isBookAcceptingBets && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelBet(bet.id)}
                                  disabled={cancellingBets.has(bet.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  {cancellingBets.has(bet.id) ? (
                                    <>
                                      <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-4 w-4 mr-1" />
                                      Cancel
                                    </>
                                  )}
                                </Button>
                              )}
                              {bet.status === 'WON' && (
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              )}
                              {bet.status === 'LOST' && (
                                <TrendingDown className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(prev => Math.max(prev - 1, 1))
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(prev => Math.min(prev + 1, totalPages))
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
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
      
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="p-4 border-b">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
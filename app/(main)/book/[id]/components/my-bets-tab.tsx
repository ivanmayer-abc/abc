'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, X, IndianRupee } from 'lucide-react'
import { formatter } from '@/lib/utils'
import { useBalanceContext } from '@/contexts/balance-context'
import { toast } from 'sonner'
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

interface UserBet {
  id: string
  amount: number
  potentialWin: number
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'CANCELLED'
  odds: number
  createdAt: Date
  settledAt?: Date | null
  outcome: {
    name: string
    id: string
  }
  event: {
    name: string
    id: string
  }
}

interface MyBetsTabProps {
  initialBets: UserBet[]
  bookId: string
}

const ITEMS_PER_PAGE = 10

export default function MyBetsTab({ initialBets, bookId }: MyBetsTabProps) {
  const [bets, setBets] = useState<UserBet[]>(initialBets)
  const [cancellingBets, setCancellingBets] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [bookData, setBookData] = useState<{ date: Date } | null>(null)
  const { refreshBalance } = useBalanceContext()

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const response = await fetch(`/api/bookmaking/client/books/${bookId}`)
        if (response.ok) {
          const book = await response.json()
          setBookData(book)
        }
      } catch (error) {
        console.error('Error fetching book data:', error)
      }
    }

    fetchBookData()
  }, [bookId])

  const handleCancelBet = async (betId: string) => {
    setCancellingBets(prev => new Set(prev).add(betId))
    
    const cancelPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/bookmaking/client/bets/${betId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await refreshBalance()
          setBets(prev => prev.filter(bet => bet.id !== betId))
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
          const newSet = new Set(prev)
          newSet.delete(betId)
          return newSet
        })
      }
    })

    toast.promise(cancelPromise, {
      loading: 'Cancelling bet...',
      success: (message) => message as string,
      error: (error) => error as string,
    })
  }

  const isBetCancellable = (bet: UserBet) => {
    if (bet.status !== 'PENDING') return false
    
    if (bookData) {
      const now = new Date()
      const bookDate = new Date(bookData.date)
      return now < bookDate
    }
    
    const now = new Date()
    const betDate = new Date(bet.createdAt)
    const timeDiff = now.getTime() - betDate.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    
    return minutesDiff < 30
  }

  const totalPages = Math.ceil(bets.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentBets = bets.slice(startIndex, endIndex)

  const calculateBetStats = () => {
    const totalBets = bets.length
    const totalStaked = bets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalPotentialWin = bets
      .filter(bet => bet.status === 'PENDING')
      .reduce((sum, bet) => sum + bet.potentialWin, 0)
    const totalWon = bets
      .filter(bet => bet.status === 'WON')
      .reduce((sum, bet) => sum + (bet.potentialWin - bet.amount), 0)
    const totalLost = bets
      .filter(bet => bet.status === 'LOST')
      .reduce((sum, bet) => sum + bet.amount, 0)

    return { totalBets, totalStaked, totalPotentialWin, totalWon, totalLost }
  }

  const betStats = calculateBetStats()

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bets</CardTitle>
        <CardDescription>
          View your betting history and manage active bets
        </CardDescription>
      </CardHeader>
      <CardContent className='p-2 sm:p-6 -mt-5 sm:mt-0'>
        {bets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You haven&apos;t placed any bets on this book yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap pl-4">Event</TableHead>
                      <TableHead className="whitespace-nowrap">Outcome</TableHead>
                      <TableHead className="whitespace-nowrap">Stake</TableHead>
                      <TableHead className="whitespace-nowrap">Odds</TableHead>
                      <TableHead className="whitespace-nowrap">Potential Win</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentBets.map((bet) => (
                      <TableRow key={bet.id}>
                        <TableCell className="whitespace-nowrap pl-4">
                          <div className="font-medium">{bet.event.name}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{bet.outcome.name}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{formatter.format(bet.amount)}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{bet.odds.toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium text-blue-600">
                            {formatter.format(bet.potentialWin)}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
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
                              {new Date(bet.createdAt).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                month: 'long',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </div>
                          </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isBetCancellable(bet) && (
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
                                    <span className="hidden sm:inline">Cancelling...</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Cancel</span>
                                  </>
                                )}
                              </Button>
                            )}
                            {bet.status === 'WON' && (
                              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                            )}
                            {bet.status === 'LOST' && (
                              <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
  )
}
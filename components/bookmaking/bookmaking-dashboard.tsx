'use client'

import { useState } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Trophy, ArrowRight, Star } from 'lucide-react'
import BettingSlipWrapper from './betting-slip-wrapper'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

interface ClientBookmakingDashboardProps {
  initialBooks: Book[]
  initialPagination: PaginationInfo
  initialCategories: string[]
  categoryParam?: string
}

export default function ClientBookmakingDashboard({
  initialBooks,
  initialPagination,
  initialCategories,
  categoryParam
}: ClientBookmakingDashboardProps) {
  const router = useRouter()
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)

  const handleOutcomeClick = (outcome: any, event: any, book: any) => {
    const now = new Date()
    const bookDate = new Date(book.date)
    
    if (now >= bookDate) {
      alert('Bets are no longer accepted for this book as the event has already started.')
      return
    }

    setSelectedOutcome({
      id: outcome.id,
      name: outcome.name,
      odds: outcome.odds,
      eventName: event.name,
      bookTitle: book.title
    })
    setIsSlipOpen(true)
  }

  const handleBetPlaced = () => {
    setIsSlipOpen(false)
    setSelectedOutcome(null)
    router.refresh()
  }

  const formatCategoryForDisplay = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  }

  const formatCategoryForURL = (category: string) => {
    return category.toLowerCase()
  }

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', newPage.toString())
    router.push(url.toString())
  }

  const books = initialBooks || []
  const categories = initialCategories || []
  const pagination = initialPagination || {
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:space-y-6 space-y-3 pb-[70px] lg:pb-0">
      <div className="lg:space-y-2 space-y-1">
        <h1 className="lg:text-3xl text-xl font-bold tracking-tight">
          {categoryParam ? `${formatCategoryForDisplay(categoryParam)} Betting` : 'Sports Betting'}
        </h1>
        <p className="text-muted-foreground text-sm lg:text-md">
          Place your bets on upcoming events
        </p>
      </div>

      {categories.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <span className="font-medium text-sm sm:text-base">Categories:</span>
              <div className="flex flex-wrap gap-2">
                <Link href="/book">
                  <Button
                    variant={!categoryParam ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    All Events
                  </Button>
                </Link>
                {categories.map(category => (
                  <Link key={category} href={`/book/category/${formatCategoryForURL(category)}`}>
                    <Button
                      variant={categoryParam && categoryParam.toLowerCase() === category.toLowerCase() ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      {formatCategoryForDisplay(category)}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {books.length === 0 ? (
        <NoBooksCard category={categoryParam} />
      ) : (
        <>
          <div className="space-y-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOutcomeClick={handleOutcomeClick}
                currentCategory={categoryParam}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <ShadcnPagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </>
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

function ShadcnPagination({ 
  pagination, 
  onPageChange 
}: { 
  pagination: PaginationInfo
  onPageChange: (page: number) => void 
}) {
  const { currentPage, totalPages } = pagination

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      let start = Math.max(1, currentPage - 2)
      let end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      if (end === totalPages) {
        start = Math.max(1, totalPages - maxVisiblePages + 1)
      }
      
      for (let i = start; i <= end; i++) pages.push(i)
      
      if (start > 1) {
        pages.unshift(1)
        if (start > 2) pages.splice(1, 0, 'ellipsis-start')
      }
      
      if (end < totalPages) {
        pages.push(totalPages)
        if (end < totalPages - 1) pages.splice(pages.length - 1, 0, 'ellipsis-end')
      }
    }
    
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) onPageChange(currentPage - 1)
              }}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {getPageNumbers().map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(page as number)
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) onPageChange(currentPage + 1)
              }}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function BookCard({ 
  book, 
  onOutcomeClick,
  currentCategory
}: { 
  book: Book
  onOutcomeClick: (outcome: any, event: any, book: any) => void
  currentCategory?: string
}) {
  const bookStatus = book.displayStatus || (book.isLive ? 'LIVE' : 'UPCOMING')
  
  const firstFastBet = book.events?.find(event => event.isFirstFastOption)
  const secondFastBet = book.events?.find(event => event.isSecondFastOption)

  const mainTeams = book.teams?.slice(0, 2) || []

  const capitalizedStatus = bookStatus.charAt(0).toUpperCase() + bookStatus.slice(1).toLowerCase()

  const now = new Date()
  const bookDate = new Date(book.date)
  const isAcceptingBets = now < bookDate

  const displayCategory = book.category.charAt(0).toUpperCase() + book.category.slice(1).toLowerCase()

  const renderFastBetOutcomes = (event: any, isFirst: boolean = false) => {
    if (!event || !event.outcomes || event.outcomes.length === 0) return null

    return (
      <div className={`p-3 sm:p-4 rounded-lg border border-border bg-muted/20 ${isFirst ? 'flex-1' : 'w-full'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-500 shrink-0" />
          <span className="text-sm font-semibold truncate flex-1" title={event.name}>
            {event.name}
          </span>
        </div>
        <div className={`gap-2 sm:gap-3 w-full justify-between ${
          isFirst 
            ? 'xl:flex grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3' 
            : 'lg:flex grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        }`}>
          {event.outcomes.map((outcome: any) => (
            <div
              key={outcome.id}
              className={`flex items-center justify-between w-full p-2 sm:p-3 bg-background rounded-lg border border-border transition-all duration-200 group ${
                isAcceptingBets 
                  ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30' 
                  : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => isAcceptingBets && onOutcomeClick(outcome, event, book)}
            >
              <span className={`text-xs sm:text-sm font-medium truncate mr-2 flex-1 ${
                isAcceptingBets ? 'group-hover:text-primary' : ''
              }`}>
                {outcome.name}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs sm:text-sm shrink-0 min-w-10 sm:min-w-12 text-center ${
                  isAcceptingBets 
                    ? 'bg-primary/20 group-hover:bg-primary/30' 
                    : 'bg-muted'
                }`}
              >
                {outcome.odds.toFixed(2)}
              </Badge>
            </div>
          ))}
        </div>
        {!isAcceptingBets && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Bets closed - Event started
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow bg-card border-border">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {book.image && (
            <img 
              src={book.image} 
              alt={book.title}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-border shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
              <h3 className="font-semibold text-lg sm:text-xl truncate text-foreground">{book.title}</h3>
              <div className="flex gap-2 sm:flex-row flex-col">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs bg-muted w-fit">
                    {displayCategory}
                  </Badge>
                  <Badge variant={
                    bookStatus === 'LIVE' ? 'default' : 
                    bookStatus === 'UPCOMING' ? 'secondary' : 'outline'
                  } className="text-xs w-fit">
                    {capitalizedStatus}
                  </Badge>
                </div>
                <div className='flex'>
                  {!isAcceptingBets && (
                    <Badge variant="outline" className="text-xs bg-destructive/20 text-destructive">
                      Bets Closed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm">
                  {new Date(book.date).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    year: 'numeric',
                    month: 'long',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </span>
              </div>
              
            </div>
          </div>
        </div>
        
        <Link href={`/book/${book.id}`} className="w-full sm:w-auto">
          <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
            All outcomes
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 lg:mb-4">
        {mainTeams.length > 0 && (
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 lg:mb-0 lg:w-[400px] lg:shrink-0">
            {mainTeams.map((team) => (
              <div key={team.id} className="flex items-center gap-2 sm:gap-3">
                {team.image && (
                  <img 
                    src={team.image} 
                    alt={team.name}
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border border-border shrink-0"
                  />
                )}
                <span className="text-sm sm:text-base font-medium text-foreground truncate">{team.name}</span>
              </div>
            ))}
            {book.teams && book.teams.length > 2 && (
              <Badge variant="outline" className="text-xs bg-muted w-fit">
                +{book.teams.length - 2} more
              </Badge>
            )}
          </div>
        )}

        <div className="lg:flex-1 mb-4 lg:mb-0">
          {firstFastBet && renderFastBetOutcomes(firstFastBet, true)}
        </div>
      </div>

      <div className="w-full">
        {secondFastBet && renderFastBetOutcomes(secondFastBet, false)}
      </div>

      {!firstFastBet && !secondFastBet && (
        <div className="text-center py-6 sm:py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">No fast bets available for this book</p>
        </div>
      )}
    </Card>
  )
}

function NoBooksCard({ category }: { category?: string }) {
  return (
    <Card className="text-center py-8 sm:py-12 bg-card border-border">
      <CardContent>
        <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2">
          {category ? `No books found in "${category}" category` : 'No books available'}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm sm:text-base">
          {category 
            ? 'There are no active betting books in this category at the moment.'
            : 'There are no active betting books at the moment.'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/book">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              View All Events
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
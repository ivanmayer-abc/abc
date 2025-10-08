// components/bookmaking/client-dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Calendar, Trophy, ArrowRight, Star } from 'lucide-react'
import BettingSlipWrapper from './betting-slip-wrapper'
import { formatter } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

export default function ClientBookmakingDashboard() {
  const params = useParams()
  const categoryParam = params.category as string
  
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchBooksAndCategories()
  }, [categoryParam])

  const fetchBooksAndCategories = async () => {
    try {
      setLoading(true)
      
      const booksUrl = categoryParam 
        ? `/api/bookmaking/client/books?category=${encodeURIComponent(categoryParam)}`
        : '/api/bookmaking/client/books'
      
      console.log('Fetching books from:', booksUrl)
      
      const booksResponse = await fetch(booksUrl)
      if (booksResponse.ok) {
        const booksData: Book[] = await booksResponse.json()
        console.log('Fetched books:', booksData)
        setBooks(booksData)
      } else {
        console.error('Failed to fetch books:', booksResponse.status)
      }

      const categoriesResponse = await fetch('/api/bookmaking/client/books')
      if (categoriesResponse.ok) {
        const allBooks: Book[] = await categoriesResponse.json()
        const uniqueCategories = Array.from(new Set(allBooks.map(book => book.category)))
        setCategories(uniqueCategories)
        console.log('Fetched categories:', uniqueCategories)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    fetchBooksAndCategories()
  }

  const formatCategoryForDisplay = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  }

  const formatCategoryForURL = (category: string) => {
    return category.toLowerCase()
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {categoryParam ? `${formatCategoryForDisplay(categoryParam)} Betting` : 'Sports Betting'}
        </h1>
        <p className="text-muted-foreground">
          Place your bets on upcoming events
        </p>
      </div>

      {categories.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Categories:</span>
              <div className="flex flex-wrap gap-2">
                <Link href="/book">
                  <Button
                    variant={!categoryParam ? 'default' : 'outline'}
                    size="sm"
                  >
                    All Events
                  </Button>
                </Link>
                {categories.map(category => (
                  <Link key={category} href={`/book/category/${formatCategoryForURL(category)}`}>
                    <Button
                      variant={categoryParam && categoryParam.toLowerCase() === category.toLowerCase() ? 'default' : 'outline'}
                      size="sm"
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
        <NoBooksCard onRetry={fetchBooksAndCategories} category={categoryParam} />
      ) : (
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

// Updated BookCard Component with category in back link
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
  
  // Get fast bet events
  const firstFastBet = book.events?.find(event => event.isFirstFastOption)
  const secondFastBet = book.events?.find(event => event.isSecondFastOption)

  // Get main teams (first two teams)
  const mainTeams = book.teams?.slice(0, 2) || []

  // Capitalize first letter of status
  const capitalizedStatus = bookStatus.charAt(0).toUpperCase() + bookStatus.slice(1).toLowerCase()

  // Check if book is accepting bets (date hasn't started)
  const now = new Date()
  const bookDate = new Date(book.date)
  const isAcceptingBets = now < bookDate

  // Format category for display
  const displayCategory = book.category.charAt(0).toUpperCase() + book.category.slice(1).toLowerCase()

  // Create back link - preserve current category if exists
  const backLink = currentCategory ? `/book/category/${currentCategory}` : '/book'

  const renderFastBetOutcomes = (event: any, isFirst: boolean = false) => {
    if (!event || !event.outcomes || event.outcomes.length === 0) return null

    return (
      <div className={`p-4 rounded-lg border border-border bg-muted/20 ${isFirst ? 'flex-1' : 'w-full'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold truncate flex-1" title={event.name}>
            {event.name}
          </span>
        </div>
        <div className={`grid gap-3 ${isFirst ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
          {event.outcomes.map((outcome: any) => (
            <div
              key={outcome.id}
              className={`flex items-center justify-between p-3 bg-background rounded-lg border border-border transition-all duration-200 group ${
                isAcceptingBets 
                  ? 'cursor-pointer hover:bg-primary/10 hover:border-primary/30' 
                  : 'cursor-not-allowed opacity-60'
              }`}
              onClick={() => isAcceptingBets && onOutcomeClick(outcome, event, book)}
            >
              <span className={`text-sm font-medium truncate mr-2 flex-1 ${
                isAcceptingBets ? 'group-hover:text-primary' : ''
              }`}>
                {outcome.name}
              </span>
              <Badge 
                variant="secondary" 
                className={`text-sm shrink-0 min-w-12 text-center ${
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
    <Card className="p-6 hover:shadow-md transition-shadow bg-card border-border">
      {/* Book Header with View All Outcomes button */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {book.image && (
            <img 
              src={book.image} 
              alt={book.title}
              className="w-16 h-16 rounded-lg object-cover border border-border"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-xl truncate text-foreground">{book.title}</h3>
              <Badge variant={
                bookStatus === 'LIVE' ? 'default' : 
                bookStatus === 'UPCOMING' ? 'secondary' : 'outline'
              } className="shrink-0 text-sm">
                {capitalizedStatus}
              </Badge>
              {!isAcceptingBets && (
                <Badge variant="outline" className="shrink-0 text-sm bg-destructive/20 text-destructive">
                  Bets Closed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(book.date).toLocaleString()}</span>
              <Badge variant="secondary" className="text-xs bg-muted">
                {displayCategory}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* View All Outcomes button in same line as book name */}
        <Link href={`/book/${book.id}`}>
          <Button size="sm" variant="outline" className="shrink-0">
            View All Outcomes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Teams and First Fast Bet on same line - Desktop */}
      <div className="lg:flex lg:items-start lg:gap-6 lg:mb-4">
        {/* Teams Section - Vertical Layout */}
        {mainTeams.length > 0 && (
          <div className="flex flex-col gap-4 mb-4 lg:mb-0 lg:w-48 lg:shrink-0">
            {mainTeams.map((team) => (
              <div key={team.id} className="flex items-center gap-3">
                {team.image && (
                  <img 
                    src={team.image} 
                    alt={team.name}
                    className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                  />
                )}
                <span className="text-base font-medium text-foreground">{team.name}</span>
              </div>
            ))}
            {book.teams && book.teams.length > 2 && (
              <Badge variant="outline" className="text-sm bg-muted w-fit">
                +{book.teams.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* First Fast Bet - Same line as teams on desktop */}
        <div className="lg:flex-1">
          {firstFastBet && renderFastBetOutcomes(firstFastBet, true)}
        </div>
      </div>

      {/* Second Fast Bet - Below on all screens */}
      <div className="w-full">
        {secondFastBet && renderFastBetOutcomes(secondFastBet, false)}
      </div>

      {/* No Fast Bets Message */}
      {!firstFastBet && !secondFastBet && (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No fast bets available for this book</p>
        </div>
      )}
    </Card>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-muted" />
        <Skeleton className="h-4 w-96 bg-muted" />
      </div>
      
      {/* Category Links Skeleton */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20 bg-muted" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 bg-muted" />
              <Skeleton className="h-8 w-24 bg-muted" />
              <Skeleton className="h-8 w-24 bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Book Skeletons */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 bg-card border-border">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4 flex-1">
              <Skeleton className="w-16 h-16 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-48 bg-muted" />
                  <Skeleton className="h-5 w-16 bg-muted" />
                </div>
                <Skeleton className="h-4 w-32 bg-muted" />
              </div>
            </div>
            <Skeleton className="h-8 w-32 bg-muted" />
          </div>
          
          {/* Teams and First Fast Bet line */}
          <div className="lg:flex lg:items-start lg:gap-6 lg:mb-4">
            {/* Teams */}
            <div className="flex flex-col gap-4 mb-4 lg:mb-0 lg:w-48">
              <Skeleton className="h-12 w-full bg-muted" />
              <Skeleton className="h-12 w-full bg-muted" />
              <Skeleton className="h-6 w-20 bg-muted" />
            </div>
            {/* First Fast Bet */}
            <Skeleton className="h-32 w-full rounded-lg bg-muted lg:flex-1" />
          </div>
          
          {/* Second Fast Bet */}
          <Skeleton className="w-full h-32 rounded-lg bg-muted" />
        </Card>
      ))}
    </div>
  )
}

// Updated NoBooksCard to show category-specific message
function NoBooksCard({ onRetry, category }: { onRetry: () => void; category?: string }) {
  return (
    <Card className="text-center py-12 bg-card border-border">
      <CardContent>
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {category ? `No books found in "${category}" category` : 'No books available'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {category 
            ? 'There are no active betting books in this category at the moment.'
            : 'There are no active betting books at the moment.'
          }
        </p>
        <div className="flex gap-2 justify-center">
          <Link href="/book">
            <Button variant="outline">
              View All Events
            </Button>
          </Link>
          <Button onClick={onRetry} variant="outline">
            Check Again
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
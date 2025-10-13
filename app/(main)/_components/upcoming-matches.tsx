import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Clock } from 'lucide-react'
import UpcomingMatchesClient from './upcoming-matches-client'
import { Book as BookType } from '@/app/types/bookmaking'

async function getUpcomingMatches(): Promise<BookType[]> {
  try {
    const user = await currentUser()

    const now = new Date()
    
    const books = await db.book.findMany({
      where: {
        status: 'ACTIVE',
        date: { gt: now }
      },
      include: {
        teams: true,
        events: {
          include: {
            homeTeam: true,
            awayTeam: true,
            outcomes: {
              where: { result: 'PENDING' }
            }
          },
          orderBy: [
            { isFirstFastOption: 'desc' },
            { isSecondFastOption: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 1
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    })

    if (!books || books.length === 0) return []

    return books.map(book => {
      const bookDate = new Date(book.date)
      const isUpcoming = book.status === 'ACTIVE' && now < bookDate
      
      return {
        id: book.id,
        title: book.title,
        description: book.description,
        category: book.category,
        status: book.status as 'ACTIVE' | 'INACTIVE' | 'COMPLETED',
        date: book.date,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        image: book.image,
        userId: book.userId,
        isLive: false,
        isUpcoming,
        isAcceptingBets: now < bookDate,
        displayStatus: 'UPCOMING',
        teams: book.teams?.map(team => ({
          id: team.id,
          name: team.name,
          image: team.image,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt
        })) || [],
        events: book.events?.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description,
          status: event.status,
          isFirstFastOption: event.isFirstFastOption || false,
          isSecondFastOption: event.isSecondFastOption || false,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          bookId: event.bookId,
          homeTeamId: event.homeTeamId,
          awayTeamId: event.awayTeamId,
          homeTeam: event.homeTeam ? {
            id: event.homeTeam.id,
            name: event.homeTeam.name,
            image: event.homeTeam.image,
            createdAt: event.homeTeam.createdAt,
            updatedAt: event.homeTeam.updatedAt
          } : null,
          awayTeam: event.awayTeam ? {
            id: event.awayTeam.id,
            name: event.awayTeam.name,
            image: event.awayTeam.image,
            createdAt: event.awayTeam.createdAt,
            updatedAt: event.awayTeam.updatedAt
          } : null,
          outcomes: event.outcomes?.map(outcome => ({
            id: outcome.id,
            name: outcome.name,
            odds: outcome.odds,
            probability: outcome.probability,
            stake: outcome.stake,
            result: outcome.result as 'PENDING' | 'WIN' | 'LOSE' | 'VOID' | null,
            createdAt: outcome.createdAt,
            updatedAt: outcome.updatedAt,
            eventId: outcome.eventId
          })) || []
        })) || []
      }
    })
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
    return []
  }
}

export default async function UpcomingMatches() {
  const upcomingMatches = await getUpcomingMatches()

  if (!upcomingMatches || upcomingMatches.length === 0) {
    return (
      <div className="mt-8">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/20 rounded-lg border border-border">
          <div className="p-3 bg-muted rounded-full mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No upcoming matches</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            There are no upcoming matches scheduled at the moment. Check back later for new events!
          </p>
          <Link href="/book">
            <Button variant="outline" className="flex items-center gap-2">
              Browse all events
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Upcoming matches</h2>
        </div>
        
        <Link href="/book" className="w-full sm:w-auto">
          <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <UpcomingMatchesClient books={upcomingMatches} />
    </div>
  )
}
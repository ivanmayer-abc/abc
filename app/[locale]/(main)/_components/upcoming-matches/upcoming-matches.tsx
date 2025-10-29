import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import UpcomingMatchesClient from './upcoming-matches-client'
import { Book as BookType } from '@/app/types/bookmaking'
import UpcomingMatchesEmpty from './upcoming-matches-empty'
import UpcomingMatchesHeader from './upcoming-matches-header'

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
    return <UpcomingMatchesEmpty />
  }

  return (
    <div className="mt-5 space-y-2">
      <UpcomingMatchesHeader />
      <UpcomingMatchesClient books={upcomingMatches} />
    </div>
  )
}
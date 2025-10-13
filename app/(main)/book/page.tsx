import ClientBookmakingDashboard from '@/components/bookmaking/bookmaking-dashboard'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { Book, Event, Outcome, Team } from '@/app/types/bookmaking'

function convertBookStatus(status: any): 'ACTIVE' | 'INACTIVE' | 'COMPLETED' {
  const statusMap: { [key: string]: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' } = {
    'ACTIVE': 'ACTIVE',
    'INACTIVE': 'INACTIVE', 
    'COMPLETED': 'COMPLETED',
    'SETTLED': 'COMPLETED'
  }
  
  return statusMap[status] || 'INACTIVE'
}

async function getBooksData(category?: string, page: number = 1, limit: number = 10) {
  try {

    const skip = (page - 1) * limit

    const whereCondition: any = { status: 'ACTIVE' }
    
    if (category) {
      whereCondition.category = {
        equals: category,
        mode: 'insensitive'
      }
    }

    const totalCount = await db.book.count({
      where: whereCondition
    })

    const books = await db.book.findMany({
      where: whereCondition,
      include: {
        teams: true,
        events: {
          include: {
            homeTeam: true,
            awayTeam: true,
            outcomes: {
              where: {
                result: 'PENDING'
              }
            }
          },
          orderBy: [
            { isFirstFastOption: 'desc' },
            { isSecondFastOption: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      },
      orderBy: {
        date: 'asc'
      },
      skip,
      take: limit
    })

    const serializedBooks: Book[] = books.map(book => {
      const now = new Date()
      const bookDate = new Date(book.date)
      
      const convertedStatus = convertBookStatus(book.status)
      const isLive = convertedStatus === 'ACTIVE' && now >= bookDate
      const isUpcoming = convertedStatus === 'ACTIVE' && now < bookDate
      
      const serializedBook = {
        ...book,
        status: convertedStatus,
        date: book.date.toISOString(),
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        isLive,
        isUpcoming,
        isAcceptingBets: now < bookDate,
        displayStatus: convertedStatus === 'ACTIVE' 
          ? (now >= bookDate ? 'LIVE' : 'UPCOMING')
          : convertedStatus
      } as unknown as Book

      if (book.teams) {
        serializedBook.teams = book.teams.map(team => ({
          ...team,
          createdAt: team.createdAt.toISOString(),
          updatedAt: team.updatedAt.toISOString()
        } as unknown as Team))
      }

      if (book.events) {
        serializedBook.events = book.events.map(event => {
          const serializedEvent = {
            ...event,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString()
          } as unknown as Event

          if (event.homeTeam) {
            serializedEvent.homeTeam = {
              ...event.homeTeam,
              createdAt: event.homeTeam.createdAt.toISOString(),
              updatedAt: event.homeTeam.updatedAt.toISOString()
            } as unknown as Team
          }

          if (event.awayTeam) {
            serializedEvent.awayTeam = {
              ...event.awayTeam,
              createdAt: event.awayTeam.createdAt.toISOString(),
              updatedAt: event.awayTeam.updatedAt.toISOString()
            } as unknown as Team
          }

          if (event.outcomes) {
            serializedEvent.outcomes = event.outcomes.map(outcome => ({
              ...outcome,
              createdAt: outcome.createdAt.toISOString(),
              updatedAt: outcome.updatedAt.toISOString()
            } as unknown as Outcome))
          }

          return serializedEvent
        })
      }

      return serializedBook
    })

    return {
      books: serializedBooks,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error fetching books:', error)
    return { 
      books: [], 
      pagination: { 
        currentPage: 1, 
        totalPages: 0, 
        totalCount: 0, 
        hasNext: false, 
        hasPrev: false 
      } 
    }
  }
}

async function getCategoriesData() {
  try {
    const user = await currentUser()
    if (!user?.id) return []

    const allBooks = await db.book.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true }
    })

    const categories = Array.from(new Set(allBooks.map(book => book.category))).filter(Boolean)
    return categories
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
  params: { category?: string }
}

export default async function BookmakingDashboard({ searchParams, params }: PageProps) {
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1
  
  const categoryParam = params.category || (typeof searchParams.category === 'string' ? searchParams.category : undefined)
  
  const [booksData, categories] = await Promise.all([
    getBooksData(categoryParam, page, 10),
    getCategoriesData()
  ])

  return (
    <ClientBookmakingDashboard
      initialBooks={booksData.books}
      initialPagination={booksData.pagination}
      initialCategories={categories}
      categoryParam={categoryParam}
    />
  )
}
import { Book } from '@/app/types/bookmaking'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BookHeaderProps {
  book: Book & { isLive: boolean; isUpcoming: boolean }
}

export default function BookHeader({ book }: BookHeaderProps) {
  const acceptingBets = book.isUpcoming
  const hasTeams = book.teams && book.teams.length > 0

  return (
    <>
      <div className="flex items-center gap-4">
        <Link href="/book">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to books
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm">
              {book.category}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={
                book.isLive ? 'default' : 
                book.isUpcoming ? 'secondary' : 'outline'
              } className="text-sm">
                {book.isLive ? 'LIVE' : book.displayStatus?.toLowerCase()}
              </Badge>
              {!acceptingBets && (
                <Badge variant="outline" className="text-sm bg-destructive/20 text-destructive">
                  Bets Closed
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <Calendar className="h-4 w-4" />
            <span>{new Date(book.date).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}</span>
          </div>

          <Separator className="mb-6" />

          {hasTeams && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams
              </h2>
              <div className="flex flex-wrap gap-8 justify-center">
                {book.teams!.map((team, index) => (
                  <div key={team.id} className="flex flex-col items-center">
                    {team.image && (
                      <img 
                        src={team.image} 
                        alt={team.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-muted mb-2"
                      />
                    )}
                    <span className="font-medium text-center">{team.name}</span>
                    {index < book.teams!.length - 1 && (
                      <div className="hidden md:block absolute transform translate-x-16">
                        <span className="text-xl font-bold text-muted-foreground">vs</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-4 md:hidden">
                {book.teams!.slice(0, -1).map((_, index) => (
                  <span key={index} className="text-lg font-bold text-muted-foreground">vs</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
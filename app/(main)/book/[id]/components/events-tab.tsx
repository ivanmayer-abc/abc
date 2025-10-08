'use client'

import { Book } from '@/app/types/bookmaking'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy } from 'lucide-react'
import { formatter } from '@/lib/utils'
import { useState } from 'react'
import BettingSlipWrapper from '@/components/bookmaking/betting-slip-wrapper'
import { toast } from 'sonner'

interface EventsTabProps {
  book: Book & { isLive: boolean; isUpcoming: boolean }
  userBets: Array<{ outcomeId: string; amount: number }>
}

interface SelectedOutcome {
  id: string
  name: string
  odds: number
  eventName: string
  bookTitle: string
}

export default function EventsTab({ book, userBets }: EventsTabProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<SelectedOutcome | null>(null)
  const [isSlipOpen, setIsSlipOpen] = useState(false)

  const handleOutcomeClick = (outcome: any, event: any) => {
    if (!book.isUpcoming) {
      toast.error('Bets are no longer accepted for this book as the event has already started.')
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
    // In a real app, you might want to refresh the data here
    window.location.reload() // Simple refresh for demo
  }

  // Add user stake information to outcomes
  const eventsWithUserStake = book.events.map(event => ({
    ...event,
    outcomes: event.outcomes.map(outcome => ({
      ...outcome,
      userStake: userBets
        .filter(bet => bet.outcomeId === outcome.id)
        .reduce((total, bet) => total + bet.amount, 0)
    }))
  }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Events & Betting Options</CardTitle>
          <CardDescription>
            {book.isUpcoming 
              ? 'Choose an event and place your bet on the desired outcome'
              : book.isLive 
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
                          book.isUpcoming 
                            ? 'hover:bg-primary/5 hover:border-primary/20 cursor-pointer' 
                            : 'cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => book.isUpcoming && handleOutcomeClick(outcome, event)}
                        disabled={!book.isUpcoming}
                      >
                        <div className={`font-semibold text-base text-center ${
                          book.isUpcoming ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground'
                        }`}>
                          {outcome.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold px-3 py-1 rounded-md ${
                            book.isUpcoming ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted'
                          }`}>
                            {outcome.odds.toFixed(2)}
                          </span>
                        </div>
                        {outcome.userStake > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            Your Stake: {formatter.format(outcome.userStake)}
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                  {!book.isUpcoming && (
                    <div className="text-center text-sm text-muted-foreground italic">
                      {book.isLive ? 'Event is LIVE - Bets are closed' : 'Bets are no longer accepted for this event'}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <BettingSlipWrapper
        isOpen={isSlipOpen}
        onClose={() => {
          setIsSlipOpen(false)
          setSelectedOutcome(null)
        }}
        outcome={selectedOutcome}
        onBetPlaced={handleBetPlaced}
      />
    </>
  )
}
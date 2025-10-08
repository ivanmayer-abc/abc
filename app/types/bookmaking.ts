export interface Book {
  id: string
  title: string
  description?: string | null
  date: Date
  category: string
  status: string
  createdAt: Date
  updatedAt: Date
  teams?: Team[]
  events?: Event[]
  isLive?: boolean
  isUpcoming?: boolean
  displayStatus?: string
}

export interface Event {
  id: string
  name: string
  description?: string | null
  status: string
  isFirstFastOption?: boolean
  isSecondFastOption?: boolean
  createdAt: Date
  updatedAt: Date
  bookId: string
  outcomes?: Outcome[]
  homeTeam?: Team | null
  awayTeam?: Team | null
  homeTeamId?: string | null
  awayTeamId?: string | null
}

export interface Outcome {
  id: string
  name: string
  odds: number
  probability: number
  stake: number
  result: 'PENDING' | 'WIN' | 'LOSE' | 'VOID' | null
  createdAt: Date
  updatedAt: Date
  eventId: string
  userStake?: number
}

export interface Team {
  id: string
  name: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}
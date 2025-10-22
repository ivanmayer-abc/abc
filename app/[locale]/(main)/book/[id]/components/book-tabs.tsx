'use client'

import { Button } from '@/components/ui/button'
import { ReactNode, useState } from 'react'

interface BookTabsProps {
  children: ReactNode[]
}

export default function BookTabs({ children }: BookTabsProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'my-bets'>('events')

  return (
    <>
      <div className="flex border-b">
        <Button
          variant="ghost"
          className={`rounded-none border-b-2 ${activeTab === 'events' ? 'border-primary' : 'border-transparent'}`}
          onClick={() => setActiveTab('events')}
        >
          Events & Betting
        </Button>
        <Button
          variant="ghost"
          className={`rounded-none border-b-2 ${activeTab === 'my-bets' ? 'border-primary' : 'border-transparent'}`}
          onClick={() => setActiveTab('my-bets')}
        >
          My Bets
        </Button>
      </div>

      {activeTab === 'events' ? children[0] : children[1]}
    </>
  )
}
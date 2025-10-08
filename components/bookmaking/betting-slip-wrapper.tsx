'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import BettingSlip, { BettingSlipProps } from './betting-slip'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class BettingSlipErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('BettingSlip Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <h3 className="text-red-800 font-bold mb-2">Something went wrong</h3>
          <p className="text-red-600 text-sm mb-3">
            There was an error loading the betting slip.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function BettingSlipWrapper(props: BettingSlipProps) {
  return (
    <BettingSlipErrorBoundary>
      <BettingSlip {...props} />
    </BettingSlipErrorBoundary>
  )
}
"use client"

import { useState, useEffect } from "react"
import type { WordCard } from "@/lib/word-data"
import { WordCardItem } from "@/components/word-card-item"

interface CardStackInitialProps {
  cards: WordCard[]
  onAnimationComplete: () => void
}

export function CardStackInitial({ cards, onAnimationComplete }: CardStackInitialProps) {
  const [visibleCards, setVisibleCards] = useState<number>(0)

  useEffect(() => {
    const timer = setTimeout(
      () => {
        onAnimationComplete()
      },
      cards.length * 150 + 500,
    )

    const interval = setInterval(() => {
      setVisibleCards((prev) => {
        if (prev < cards.length) {
          return prev + 1
        }
        return prev
      })
    }, 150)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [cards.length, onAnimationComplete])

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-10 safe-area-inset-top">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-foreground">My Collection</h1>
          <p className="text-xs text-muted-foreground mt-1">Beautiful reveal animation</p>
        </div>

        {/* Stack animation container */}
        <div className="relative w-full h-96">
          {cards.slice(0, Math.min(visibleCards, 3)).map((card, index) => (
            <div
              key={card.id}
              className="absolute w-full animate-stack-reveal"
              style={{
                transform: `translateY(${index * 12}px) scale(${1 - index * 0.05})`,
                zIndex: cards.length - index,
              }}
            >
              <WordCardItem card={card} onClick={() => {}} isNew={false} />
            </div>
          ))}
        </div>

        {/* Rest of cards will show after animation */}
        {visibleCards >= cards.length && (
          <div className="mt-8 space-y-3">
            {cards.slice(3).map((card) => (
              <WordCardItem key={card.id} card={card} onClick={() => {}} isNew={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

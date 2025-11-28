"use client"

import type React from "react"
import { useState } from "react"
import type { WordCard } from "@/lib/word-data"

interface StackCardProps {
  cards: WordCard[]
  onComplete?: () => void
}

export function StackCard({ cards, onComplete }: StackCardProps) {
  const [displayedCards, setDisplayedCards] = useState(cards)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragStart, setDragStart] = useState(0)

  const moveToEnd = (index: number) => {
    setDisplayedCards((prev) => [...prev.slice(index + 1), prev[index]])
  }

  const offset = 8
  const scaleStep = 0.04
  const dimStep = 0.12

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    if (index !== 0) return
    setDragStart(e.clientY)
    setDraggedIndex(index)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedIndex !== 0) return
    const diff = dragStart - e.clientY
    if (diff > 50) {
      moveToEnd(0)
      setDraggedIndex(null)
    }
  }

  const handleMouseUp = () => {
    setDraggedIndex(null)
  }

  return (
    <div
      className="relative w-full h-72 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <ul className="relative w-full max-w-xs mx-auto h-full m-0 p-0">
        {displayedCards.map(({ id, word, vietnameseMeaning, category, pronunciation, capturedImages }, i) => {
          const isFront = i === 0
          const brightness = Math.max(0.4, 1 - i * dimStep)
          const baseZ = displayedCards.length - i

          const imageUrl =
            capturedImages[0] ||
            `/placeholder.svg?height=200&width=280&query=${encodeURIComponent(word)} vocabulary card`

          return (
            <li
              key={id}
              className={`absolute w-full h-full list-none overflow-hidden rounded-2xl border border-border transition-all duration-300 ${
                isFront ? "cursor-grab active:cursor-grabbing" : ""
              }`}
              style={{
                transform: `translateY(${i * -offset}%) scale(${1 - i * scaleStep})`,
                opacity: brightness,
                zIndex: baseZ,
                boxShadow: isFront
                  ? "0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)"
                  : "0 8px 16px rgba(0, 0, 0, 0.08)",
              }}
              onMouseDown={(e) => handleMouseDown(i, e)}
            >
              {/* Image background */}
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={word}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-xs font-medium text-white/70 mb-1">{category}</p>
                <h3 className="text-xl font-bold mb-1">{word}</h3>
                <p className="text-sm text-white/80 line-clamp-1">{vietnameseMeaning}</p>
                <p className="text-xs text-white/60 mt-1">{pronunciation}</p>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Drag hint */}
      {displayedCards.length > 1 && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground animate-float">
          Drag up to reveal next card
        </div>
      )}
    </div>
  )
}

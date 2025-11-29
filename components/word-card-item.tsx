"use client"

import type React from "react"
import { Volume2 } from "lucide-react"
import type { WordCard } from "@/lib/word-data"
import { withBasePath } from "@/lib/asset-path"

interface WordCardItemProps {
  card: WordCard
  onClick: () => void
  isNew?: boolean
}

export function WordCardItem({ card, onClick, isNew }: WordCardItemProps) {
  const speak = (e: React.MouseEvent) => {
    e.stopPropagation()
    const utterance = new SpeechSynthesisUtterance(card.word)
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  const dictionaryImage = card.cardImages?.[0]
  let imageSrc: string | undefined = card.capturedImages[0]

  if (!imageSrc && dictionaryImage) {
    imageSrc = withBasePath(dictionaryImage)
  }

  if (!imageSrc) {
    imageSrc = withBasePath(
      `/placeholder.svg?height=140&width=140&query=${encodeURIComponent(card.word) || "vocabulary card"}`,
    )
  }

  const categoryColors: Record<string, string> = {
    Electronics: "bg-blue-100 text-blue-700 border-blue-200",
    Furniture: "bg-amber-100 text-amber-700 border-amber-200",
    Education: "bg-purple-100 text-purple-700 border-purple-200",
    Kitchen: "bg-rose-100 text-rose-700 border-rose-200",
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className={`group bg-card border border-border rounded-2xl overflow-hidden text-left hover:border-primary/40 active:scale-95 transition-all duration-200 w-full ${
        isNew ? "shadow-glow-primary animate-stack-reveal" : "shadow-soft hover:shadow-md"
      }`}
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={imageSrc}
          alt={card.word}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content - tighter padding and smaller text */}
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <h3 className="font-bold text-foreground text-sm truncate">{card.word}</h3>
          <button
            onClick={speak}
            className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all flex-shrink-0"
          >
            <Volume2 className="w-3 h-3 text-primary" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{card.vietnameseMeaning}</p>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${
              categoryColors[card.category] || "bg-muted text-muted-foreground border-border"
            }`}
          >
            {card.category}
          </span>
          <span className="text-[9px] text-muted-foreground truncate">{card.pronunciation}</span>
        </div>
      </div>
    </div>
  )
}

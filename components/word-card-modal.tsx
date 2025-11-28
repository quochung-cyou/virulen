"use client"

import { X, Sparkles } from "lucide-react"
import type { WordCard } from "@/lib/word-data"
import { Button } from "@/components/ui/button"

interface WordCardModalProps {
  word: WordCard
  onClose: () => void
  onViewDetails: () => void
}

export function WordCardModal({ word, onClose, onViewDetails }: WordCardModalProps) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word.word)
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-card-reveal">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Success badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-glow-primary">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">New word collected!</p>
            <p className="text-xs text-muted-foreground">Added to your collection</p>
          </div>
        </div>

        {/* Word display */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-foreground mb-3">{word.word}</h2>
          <button
            onClick={speak}
            className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
          >
            {/* Animated waveform */}
            <div className="flex items-center gap-0.5 h-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full transition-all group-hover:animate-pulse"
                  style={{
                    height: `${8 + Math.sin(i) * 8}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{word.pronunciation}</span>
          </button>
        </div>

        {/* Vietnamese meaning */}
        <div className="bg-secondary/60 rounded-2xl p-4 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nghĩa tiếng Việt</p>
          <p className="text-xl font-semibold text-foreground">{word.vietnameseMeaning}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-12 rounded-xl bg-transparent border-2" onClick={onClose}>
            Continue
          </Button>
          <Button className="flex-1 h-12 rounded-xl shadow-glow-primary" onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}

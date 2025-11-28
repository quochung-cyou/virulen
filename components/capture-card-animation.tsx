"use client"

import { useState, useEffect } from "react"
import { X, Sparkles, Volume2 } from "lucide-react"
import type { WordCard } from "@/lib/word-data"
import { Button } from "@/components/ui/button"

interface CaptureCardAnimationProps {
  word: WordCard
  onClose: () => void
  onViewDetails: () => void
}

export function CaptureCardAnimation({ word, onClose, onViewDetails }: CaptureCardAnimationProps) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) return
    }, 0)
    return () => clearTimeout(timer)
  }, [isOpen])

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word.word)
    utterance.lang = "en-US"
    speechSynthesis.speak(utterance)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-sm transition-all duration-500 ${
          isOpen ? "animate-card-pop-in" : "scale-90 opacity-0"
        }`}
      >
        <div className="bg-card rounded-3xl overflow-hidden shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/60 backdrop-blur flex items-center justify-center hover:bg-background/80 transition-all active:scale-95"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          {/* Image section with zoom animation */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={
                word.capturedImages[0] ||
                `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(word.word) || "/placeholder.svg"} object`
              }
              alt={word.word}
              className="w-full h-full object-cover animate-image-zoom"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/30" />
          </div>

          {/* Content section */}
          <div className="px-6 py-5">
            {/* Success badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-glow-primary animate-bounce">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">New word collected!</p>
                <p className="text-[10px] text-muted-foreground">Added to your collection</p>
              </div>
            </div>

            {/* Word display */}
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-foreground mb-2">{word.word}</h2>

              {/* Pronunciation with speaker button */}
              <button
                onClick={speak}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group mb-3"
              >
                <Volume2 className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm text-primary font-medium">{word.pronunciation}</span>
              </button>

              {/* Example sentences */}
              <div className="space-y-2">
                {word.exampleSentences &&
                  word.exampleSentences.slice(0, 2).map((sentence, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground italic">
                      • {sentence}
                    </div>
                  ))}
              </div>
            </div>

            {/* Vietnamese meaning */}
            <div className="bg-secondary/40 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Nghĩa tiếng Việt</p>
              <p className="text-base font-semibold text-foreground">{word.vietnameseMeaning}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg bg-transparent border-2"
                onClick={handleClose}
              >
                Continue
              </Button>
              <Button className="flex-1 h-10 rounded-lg shadow-glow-primary" onClick={onViewDetails}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

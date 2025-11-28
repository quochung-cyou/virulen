"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Star, Share2, Sparkles, Volume2 } from "lucide-react"
import { FloatingDock } from "@/components/floating-dock"
import { AudioRecorder } from "@/components/audio-recorder"
import { getCollectedCards, isCardFavorite, setCardFavorite } from "@/lib/storage"
import type { WordCard } from "@/lib/word-data"
import { getCardDefinitionById } from "@/lib/card-dictionary"
import { createWordCardInstance } from "@/lib/card-types"
import { Button } from "@/components/ui/button"

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [card, setCard] = useState<WordCard | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [practiceTarget, setPracticeTarget] = useState<string | null>(null)
  const [practiceLabel, setPracticeLabel] = useState<string>("Word")

  useEffect(() => {
    const id = params.id as string
    const collected = getCollectedCards()
    let found = collected.find((c) => c.id === id)

    if (!found) {
      const def = getCardDefinitionById(id)
      if (def) {
        found = createWordCardInstance(def)
      }
    }

    if (found) {
      setCard(found)
      setIsFavorite(isCardFavorite(found.id))
      setPracticeTarget(found.word)
    }
  }, [params.id])

  const speak = () => {
    if (card) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(card.word)
      utterance.lang = "en-US"
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    }
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Blurred background image */}
      <div className="fixed inset-0 -z-10">
        <img
          src={
            card.capturedImages[0] ||
            `/placeholder.svg?height=800&width=400&query=${encodeURIComponent(card.word)} object`
          }
          alt=""
          className="w-full h-full object-cover opacity-10 blur-3xl scale-110"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="max-w-md mx-auto px-5 pt-14 safe-area-inset-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!card) return
                const next = !isFavorite
                setIsFavorite(next)
                setCardFavorite(card.id, next)
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                isFavorite
                  ? "bg-amber-100 text-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
                  : "glass text-foreground shadow-soft hover:scale-105"
              }`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </button>
            <button className="w-11 h-11 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 active:scale-95 transition-transform">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Word Header Card */}
        <div className="bg-card border border-border rounded-[2rem] p-8 mb-6 shadow-soft text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">{card.word}</h1>
          <button
            onClick={speak}
            className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
          >
            {/* Animated waveform - responds to speaking state */}
            <div className="flex items-center gap-0.5 h-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-1 bg-primary rounded-full transition-all ${isSpeaking ? "animate-pulse" : ""}`}
                  style={{
                    height: isSpeaking ? `${8 + Math.random() * 10}px` : `${6 + Math.sin(i * 1.2) * 6}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            <span className="font-medium">{card.pronunciation}</span>
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "text-primary" : ""}`} />
          </button>
          <p className="text-sm text-muted-foreground mt-2">{card.phonetic}</p>
        </div>

        {/* Vietnamese Meaning */}
        <div className="bg-secondary/60 rounded-3xl p-5 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">Nghĩa tiếng Việt</p>
          <p className="text-2xl font-semibold text-foreground">{card.vietnameseMeaning}</p>
        </div>

        {/* Audio Recorder */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                setPracticeTarget(card.word)
                setPracticeLabel("Word")
              }}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                practiceTarget === card.word
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border"
              }`}
            >
              Word
            </button>
            {card.exampleSentences.map((sentence, index) => (
              <button
                key={index}
                onClick={() => {
                  setPracticeTarget(sentence)
                  setPracticeLabel(`Sentence ${index + 1}`)
                }}
                className={`px-3 py-1.5 rounded-full border text-left transition-colors ${
                  practiceTarget === sentence
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
              >
                {`Sentence ${index + 1}`}
              </button>
            ))}
          </div>

          <AudioRecorder
            key={`${practiceLabel}-${practiceTarget ?? card.word}`}
            targetText={practiceTarget ?? card.word}
            label={practiceLabel}
          />
        </div>

        {/* AI Context Sentence */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-3xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wide">AI Scene Description</p>
          </div>
          <p className="text-foreground leading-relaxed">
            This {card.word.toLowerCase()} was scanned in your environment. It&apos;s commonly found in{" "}
            {card.category.toLowerCase()} settings and is an essential vocabulary word for everyday English
            conversations.
          </p>
        </div>

        {/* Example Sentences */}
        <div className="bg-card border border-border rounded-3xl p-5 mb-6 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4">Example Sentences</h3>
          <div className="space-y-4">
            {card.exampleSentences.map((sentence, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {index + 1}
                </span>
                <p className="text-foreground leading-relaxed pt-0.5">{sentence}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Captured Images - fixed paths */}
        <div className="bg-card border border-border rounded-3xl p-5 mb-6 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4">Captured Images</h3>
          <div className="grid grid-cols-2 gap-3">
            {card.capturedImages.map((image, index) => (
              <div key={index} className="aspect-square bg-muted rounded-2xl overflow-hidden shadow-soft">
                <img
                  src={
                    image ||
                    `/placeholder.svg?height=150&width=150&query=${encodeURIComponent(card.word)} photo ${index + 1}`
                  }
                  alt={`${card.word} - Image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
            <button className="aspect-square bg-muted/30 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary active:scale-95 transition-all gap-1">
              <span className="text-2xl">+</span>
              <span className="text-xs">Add photo</span>
            </button>
          </div>
        </div>

        {/* Category & Date */}
        <div className="flex items-center justify-between text-sm mb-6">
          <span className="px-4 py-1.5 bg-secondary rounded-full text-secondary-foreground font-medium">
            {card.category}
          </span>
          <span className="text-muted-foreground">Collected {new Date(card.collectedAt).toLocaleDateString()}</span>
        </div>

        {/* Practice Button */}
        <Button
          className="w-full h-14 text-lg rounded-2xl shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-transform"
          onClick={speak}
        >
          Practice This Word
        </Button>
      </div>

      <FloatingDock />
    </div>
  )
}

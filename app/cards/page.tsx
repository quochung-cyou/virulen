"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react"
import { motion } from "framer-motion"
import { FloatingDock } from "@/components/floating-dock"
import { WordCardItem } from "@/components/word-card-item"
import { getCollectedCards } from "@/lib/storage"
import { type WordCard } from "@/lib/word-data"

export default function CardsPage() {
  const router = useRouter()
  const [cards, setCards] = useState<WordCard[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const collected = getCollectedCards()
    setCards(collected)
    setIsLoading(false)
  }, [])

  const categories = [...new Set(cards.map((c) => c.category))]

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.vietnameseMeaning.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || card.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-background pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-md mx-auto px-4 pt-10 safe-area-inset-top">
        {/* Header - smaller */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">My Collection</h1>
          <div className="w-9 h-9" />
        </div>

        {/* Search - smaller */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 shadow-soft transition-all"
          />
        </div>

        {/* Category filters - tighter */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              !selectedCategory
                ? "bg-primary text-primary-foreground shadow-glow-primary"
                : "bg-card border border-border text-foreground hover:border-primary/30"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground shadow-glow-primary"
                  : "bg-card border border-border text-foreground hover:border-primary/30"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stats - smaller text */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCards.length}</span> word
            {filteredCards.length !== 1 ? "s" : ""} in collection
          </p>
        </div>

        <div className="relative min-h-[360px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative pointer-events-auto"
          >
            {/* Cards list */}
            {filteredCards.length > 0 ? (
              <div className="space-y-3">
                {filteredCards.map((card, index) => {
                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{
                        opacity: 0,
                        y: 10,
                        scale: 1,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        filter: "brightness(1)",
                      }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <WordCardItem
                        card={card}
                        onClick={() => router.push(`/cards/${card.id}`)}
                        isNew={index === 0}
                      />
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📷</span>
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">No cards yet</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[240px] mx-auto">
                  Start scanning objects around you to build your vocabulary collection!
                </p>
                <button
                  onClick={() => router.push("/scan")}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm shadow-glow-primary hover:scale-105 transition-transform"
                >
                  Start Scanning
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <FloatingDock />
    </motion.div>
  )
}

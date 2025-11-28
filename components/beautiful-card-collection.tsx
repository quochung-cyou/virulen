"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Search, SlidersHorizontal, Grid, List } from "lucide-react"
import { FloatingDock } from "@/components/floating-dock"
import { WordCardItem } from "@/components/word-card-item"
import type { WordCard } from "@/lib/word-data"

interface BeautifulCardCollectionProps {
  cards: WordCard[]
  onStackComplete: () => void
}

export function BeautifulCardCollection({ cards, onStackComplete }: BeautifulCardCollectionProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const categories = [...new Set(cards.map((c) => c.category))]

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.vietnameseMeaning.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || card.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-10 safe-area-inset-top">
        {/* Header - compact */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">My Collection</h1>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 active:scale-95 transition-transform"
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4 text-foreground" />
            ) : (
              <Grid className="w-4 h-4 text-foreground" />
            )}
          </button>
        </div>

        {/* Search bar - smaller */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-soft transition-all"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
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
        <div className="mb-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{filteredCards.length}</span> word
            {filteredCards.length !== 1 ? "s" : ""} collected
          </p>
        </div>

        {/* Cards display */}
        {filteredCards.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"}>
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <WordCardItem card={card} onClick={() => router.push(`/cards/${card.id}`)} isNew={index === 0} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📷</span>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-2">No cards found</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-[240px] mx-auto">
              Try adjusting your filters or start scanning to build your collection!
            </p>
            <button
              onClick={() => router.push("/scan")}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium text-xs shadow-glow-primary hover:scale-105 active:scale-95 transition-transform"
            >
              Start Scanning
            </button>
          </div>
        )}
      </div>

      <FloatingDock />
    </div>
  )
}

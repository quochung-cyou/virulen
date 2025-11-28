"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Star, Sparkles } from "lucide-react"
import { FloatingDock } from "@/components/floating-dock"

export default function FavoritesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-5 pt-14 safe-area-inset-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Favorites</h1>
          <div className="w-11" />
        </div>

        {/* Empty State */}
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
            <Star className="w-12 h-12 text-amber-500" />
          </div>
          <h3 className="font-semibold text-foreground text-xl mb-3">No favorites yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-[260px] mx-auto leading-relaxed">
            Mark your favorite words by tapping the star icon on any word card to save them here.
          </p>
          <button
            onClick={() => router.push("/cards")}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium shadow-glow-primary hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            Browse Cards
          </button>
        </div>
      </div>

      <FloatingDock />
    </div>
  )
}

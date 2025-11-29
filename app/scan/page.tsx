"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, HelpCircle, Lightbulb } from "lucide-react"
import { FloatingDock } from "@/components/floating-dock"
import { ScanCamera } from "@/components/scan-camera"
import { addCard, getStats, updateStats } from "@/lib/storage"
import { AnimatePresence, motion } from "framer-motion"
import { withBasePath } from "@/lib/asset-path"

export default function ScanPage() {
  const router = useRouter()
  const [currentItems, setCurrentItems] = useState<
    { card: import("@/lib/word-data").WordCard; confidence: number; imageDataUrl?: string }[]
  >([])
  const [caughtCard, setCaughtCard] = useState<import("@/lib/word-data").WordCard | null>(null)
  const [caughtImageUrl, setCaughtImageUrl] = useState<string | undefined>(undefined)
  const [isAnimatingCatch, setIsAnimatingCatch] = useState(false)
  const [scanMode, setScanMode] = useState<"realtime" | "capture">("realtime")

  // Track time spent on the scan screen and add it to stats.totalTime
  useEffect(() => {
    const start = Date.now()

    return () => {
      const end = Date.now()
      const seconds = Math.max(0, Math.round((end - start) / 1000))
      if (seconds === 0) return

      try {
        const current = getStats()
        const nextTotal = (current.totalTime || 0) + seconds
        updateStats({ totalTime: nextTotal })
      } catch {
        // ignore stats errors
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <div className="max-w-md mx-auto px-4 pt-10 safe-area-inset-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Scan Object</h1>
          <button className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 transition-transform">
            <HelpCircle className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Instruction - smaller */}
        <div className="flex items-center gap-2 bg-secondary/60 rounded-xl p-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-secondary-foreground">
            Point your camera at any object and tap the shutter to learn its English name!
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3 text-[11px]">
          <button
            onClick={() => setScanMode("realtime")}
            className={`px-3 py-1.5 rounded-full border transition-colors ${
              scanMode === "realtime"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border"
            }`}
          >
            Real-time
          </button>
          <button
            onClick={() => setScanMode("capture")}
            className={`px-3 py-1.5 rounded-full border transition-colors ${
              scanMode === "capture"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border"
            }`}
          >
            Capture only
          </button>
        </div>

        <ScanCamera mode={scanMode} onCurrentFrameCards={setCurrentItems} />

        {/* Currently detected objects (no history) */}
        {currentItems.length > 0 && (
          <div className="mt-4">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-2">Currently detected</p>
            <div className="space-y-2">
              {currentItems.map(({ card, confidence, imageDataUrl }) => {
                const level = confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low"
                const badgeClasses =
                  level === "high"
                    ? "bg-emerald-100 text-emerald-700"
                    : level === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700"

                const dictionaryImage = card.cardImages?.[0]
                const listThumbSrc =
                  imageDataUrl ||
                  card.capturedImages?.[0] ||
                  (dictionaryImage
                    ? withBasePath(dictionaryImage)
                    : withBasePath(
                        `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(card.word)}`,
                      ))

                return (
                <button
                  key={card.id}
                  onClick={() => {
                    if (isAnimatingCatch) return
                    setCaughtCard(card)
                    setCaughtImageUrl(imageDataUrl)
                    setIsAnimatingCatch(true)

                    setTimeout(() => {
                      addCard(card, imageDataUrl)
                      router.push(`/cards/${card.id}`)
                    }, 900)
                  }}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-card border border-border px-3 py-2 text-left shadow-soft hover:border-primary/40 hover:shadow-md active:scale-95 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img src={listThumbSrc} alt={card.word} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{card.word}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {card.vietnameseMeaning}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badgeClasses}`}
                  >
                    {card.category}
                  </span>
                </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Scan suggestions - tighter */}
        <div className="mt-4">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-2">Try scanning</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["📺 TV", "💻 Laptop", "📱 Phone", "📚 Book", "☕ Cup", "🪑 Chair"].map((item) => (
              <div
                key={item}
                className="px-3 py-1.5 bg-card border border-border rounded-full text-xs font-medium text-foreground whitespace-nowrap shadow-soft hover:border-primary/30 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAnimatingCatch && caughtCard && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/10 to-primary/10 backdrop-blur-sm" />

            <motion.div
              className="relative z-10 w-56 max-w-[80vw] rounded-2xl bg-card border border-primary/40 shadow-glow-primary px-4 py-3 flex flex-col items-center"
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="mb-2 text-xs font-semibold tracking-wide text-primary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.25 }}
              >
                New card captured!
              </motion.div>

              <motion.div
                className="w-20 h-20 rounded-xl bg-muted overflow-hidden mb-2 shadow-md"
                initial={{ scale: 0.9, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <img
                  src={
                    caughtImageUrl ||
                    caughtCard.capturedImages?.[0] ||
                    (caughtCard.cardImages && caughtCard.cardImages.length > 0
                      ? withBasePath(caughtCard.cardImages[0])
                      : withBasePath(
                          `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(caughtCard.word)}`,
                        ))
                  }
                  alt={caughtCard.word}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.25 }}
              >
                <div className="text-base font-bold text-foreground leading-tight">{caughtCard.word}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {caughtCard.vietnameseMeaning}
                </div>
              </motion.div>

              <motion.div
                className="mt-3 text-[10px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.2 }}
              >
                Adding to your inventory...
              </motion.div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <FloatingDock />
    </div>
  )
}

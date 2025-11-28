"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Flame, Target, TrendingUp, Sparkles, BookOpen } from "lucide-react"
import { FloatingDock } from "@/components/floating-dock"
import { StatsCard } from "@/components/stats-card"
import { WeekProgress } from "@/components/week-progress"
import { getStats, getCollectedCards } from "@/lib/storage"
import type { WordCard } from "@/lib/card-types"
import { getAllCardDefinitions } from "@/lib/card-dictionary"

const TOTAL_DICTIONARY_WORDS = getAllCardDefinitions().length

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    console.log("[InstallPrompt] mounted")

    const ua = window.navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream)

    const isStandaloneDisplay = window.matchMedia("(display-mode: standalone)").matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    setIsStandalone(isStandaloneDisplay || isIOSStandalone)

    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault()
      console.log("[InstallPrompt] beforeinstallprompt fired", event)
      setDeferredPrompt(event)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      console.log("[InstallPrompt] appinstalled event")
      setCanInstall(false)
      setDeferredPrompt(null)
      setIsStandalone(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any)
    window.addEventListener("appinstalled", handleAppInstalled as any)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any)
      window.removeEventListener("appinstalled", handleAppInstalled as any)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log("[InstallPrompt] install button clicked", {
      hasDeferredPrompt: !!deferredPrompt,
      canInstall,
      isStandalone,
    })
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult && choiceResult.outcome === "accepted") {
        console.log("[InstallPrompt] user accepted install prompt")
        setCanInstall(false)
        setDeferredPrompt(null)
      }
      return
    }
  }

  if (isStandalone || (!canInstall && !isIOS)) {
    return null
  }

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3.5 text-xs text-foreground shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-xs">Add app to home screen</h3>
            <p className="text-[11px] text-muted-foreground">
              Open this app faster with a one-tap shortcut on your home screen.
            </p>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground shadow-soft hover:brightness-110 active:scale-95 transition-all"
        >
          Add
        </button>
      </div>
      {isIOS && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          On iOS, tap the share icon in Safari, then choose "Add to Home Screen".
        </p>
      )}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalTime: 0,
    wordsCollected: 0,
    weekProgress: Array.from({ length: 7 }, () => Array.from({ length: 5 }, () => 0)),
    streak: 0,
  })
  const [recentCards, setRecentCards] = useState<WordCard[]>([])
  const [dailyMissionWord, setDailyMissionWord] = useState<string | null>(null)

  useEffect(() => {
    const loadedStats = getStats()
    const cards = getCollectedCards()
    const sortedRecent = [...cards].sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())

    setStats({
      ...loadedStats,
      wordsCollected: cards.length,
    })
    setRecentCards(sortedRecent.slice(0, 4))

    const allDefinitions = getAllCardDefinitions()
    const collectedIds = new Set(cards.map((card) => card.id))
    const candidates = allDefinitions.filter((entry) => !collectedIds.has(entry.id))

    if (typeof window !== "undefined" && candidates.length > 0) {
      const todayKey = new Date().toISOString().slice(0, 10)
      const storageKey = `vocabscan_daily_mission_${todayKey}`
      const storedId = window.localStorage.getItem(storageKey)

      let missionEntry = storedId ? candidates.find((entry) => entry.id === storedId) : undefined

      if (!missionEntry) {
        const randomIndex = Math.floor(Math.random() * candidates.length)
        missionEntry = candidates[randomIndex]
        window.localStorage.setItem(storageKey, missionEntry.id)
      }

      setDailyMissionWord(missionEntry.base.word)
    } else if (candidates.length === 0) {
      setDailyMissionWord("All words collected")
    }
  }, [])

  const totalWords = TOTAL_DICTIONARY_WORDS || 1
  const clampedCollected = Math.min(stats.wordsCollected, totalWords)
  const progress = clampedCollected > 0 ? ((clampedCollected / totalWords) * 100).toFixed(1) : "0.0"
  const totalMinutes = Math.floor((stats.totalTime || 0) / 60)
  const progressSubtitle =
    totalMinutes > 0
      ? `${clampedCollected}/${totalWords} words • ${totalMinutes} min scanning`
      : `${clampedCollected}/${totalWords} words collected`

  const missionLabel = dailyMissionWord && dailyMissionWord !== "All words collected" ? dailyMissionWord : "Daily quest"
  const missionSubtitle =
    dailyMissionWord && dailyMissionWord !== "All words collected"
      ? `Scan and find: ${dailyMissionWord}`
      : "You've mastered every word in this set!"

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-10 safe-area-inset-top">
        {/* Header - reduced spacing */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shadow-soft">
              <span className="text-background font-bold text-lg">V</span>
            </div>
            {/* Streak indicator - smaller */}
            <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-600">{stats.streak}</span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full glass flex items-center justify-center shadow-soft hover:scale-105 transition-transform active:scale-95">
            <Bell className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Welcome - tighter spacing */}
        <div className="mb-5">
          <p className="text-muted-foreground text-xs mb-0.5">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-foreground">Learning Hub</h1>
        </div>

        {/* Bento Grid Stats - reduced gap */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => router.push("/quests/explorer")}
            className="text-left"
          >
            <StatsCard
              icon={<Target className="w-4 h-4 text-primary" />}
              label="Daily Mission"
              value={missionLabel}
              variant="mission"
              subtitle={missionSubtitle}
            />
          </button>
          <StatsCard
            icon={<TrendingUp className="w-4 h-4 text-accent-foreground" />}
            label="Progress"
            value={`${progress}%`}
            variant="accent"
            subtitle={progressSubtitle}
          />
        </div>

        {/* Week Progress */}
        <WeekProgress data={stats.weekProgress} />

        {/* Quick Actions - reduced gap */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/scan")}
            className="group bg-primary text-primary-foreground rounded-2xl p-4 text-left shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center mb-2 group-hover:animate-float">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Scan Object</h3>
            <p className="text-xs opacity-80 mt-0.5">Discover new words</p>
          </button>
          <button
            onClick={() => router.push("/cards")}
            className="group bg-card border border-border text-foreground rounded-2xl p-4 text-left shadow-soft hover:scale-[1.02] hover:border-primary/30 active:scale-[0.98] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-2 group-hover:animate-float">
              <BookOpen className="w-5 h-5 text-secondary-foreground" />
            </div>
            <h3 className="font-semibold text-sm">My Collection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{stats.wordsCollected} cards</p>
          </button>
        </div>

        {/* Recent Scans Preview - tighter spacing */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm text-foreground">Recent Scans</h3>
            <button onClick={() => router.push("/cards")} className="text-xs text-primary font-medium hover:underline">
              See all
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {recentCards.length > 0 ? (
              recentCards.map((card) => (
                <button
                  key={card.id}
                  className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden shadow-soft hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => router.push(`/cards/${card.id}`)}
                >
                  <img
                    src={
                      card.capturedImages[0] ||
                      `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(card.word)}`
                    }
                    alt={card.word}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))
            ) : (
              <div className="text-[11px] text-muted-foreground">No scans yet. Start by scanning an object!</div>
            )}
          </div>
        </div>
      </div>
      <InstallPrompt />
      <FloatingDock />
    </div>
  )
}

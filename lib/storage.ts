import type { WordCard } from "./card-types"
import { createWordCardInstance } from "./card-types"
import { getCardDefinitionById } from "./card-dictionary"

const STORAGE_KEY = "vocabscan_cards"
const STATS_KEY = "vocabscan_stats"
const FAVORITES_KEY = "vocabscan_favorites"

interface StoredCardRef {
  id: string
  collectedAt: string
  imageDataUrl?: string
}

export interface UserStats {
  totalTime: number // in seconds
  wordsCollected: number
  weekProgress: number[][] // 7 days x activity level
  streak: number
  lastActiveDate?: string
}

function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(FAVORITES_KEY)
  if (!stored) return []
  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v) => typeof v === "string")
  } catch {
    return []
  }
}

export function getFavoriteCardIds(): string[] {
  return readFavoriteIds()
}

export function isCardFavorite(id: string): boolean {
  return readFavoriteIds().includes(id)
}

export function setCardFavorite(id: string, favorite: boolean): void {
  if (typeof window === "undefined") return
  const current = readFavoriteIds()
  const has = current.includes(id)
  let next = current
  if (favorite && !has) {
    next = [...current, id]
  } else if (!favorite && has) {
    next = current.filter((x) => x !== id)
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
}

export function getCollectedCards(): WordCard[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    const raw = JSON.parse(stored) as unknown
    if (!Array.isArray(raw)) return []

    const cards: WordCard[] = []

    for (const item of raw) {
      if (!item || typeof item !== "object") continue

      const anyItem = item as any

      // New format: { id, collectedAt }
      if (typeof anyItem.id === "string" && typeof anyItem.collectedAt === "string" && !anyItem.word) {
        const def = getCardDefinitionById(anyItem.id)
        if (!def) continue
        const collectedAt = new Date(anyItem.collectedAt)
        const card = createWordCardInstance(def, collectedAt)
        if (typeof anyItem.imageDataUrl === "string" && anyItem.imageDataUrl) {
          card.capturedImages = [anyItem.imageDataUrl, ...(card.capturedImages || [])]
        }
        cards.push(card)
        continue
      }

      // Legacy format: full WordCard stored in localStorage
      if (typeof anyItem.id === "string" && typeof anyItem.word === "string") {
        const legacyCard: WordCard = {
          ...(anyItem as WordCard),
          collectedAt: new Date(anyItem.collectedAt),
        }
        cards.push(legacyCard)
      }
    }

    return cards
  } catch {
    return []
  }
}

export function addCard(card: WordCard, imageDataUrl?: string): void {
  const stored = typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY)
  let refs: StoredCardRef[] = []

  if (stored) {
    try {
      const raw = JSON.parse(stored) as unknown
      if (Array.isArray(raw)) {
        refs = raw
          .map((item) => {
            if (!item || typeof item !== "object") return null
            const anyItem = item as any
            if (typeof anyItem.id === "string" && typeof anyItem.collectedAt === "string" && !anyItem.word) {
              const ref: StoredCardRef = {
                id: anyItem.id,
                collectedAt: anyItem.collectedAt,
              }
              if (typeof anyItem.imageDataUrl === "string" && anyItem.imageDataUrl) {
                ref.imageDataUrl = anyItem.imageDataUrl
              }
              return ref
            }
            if (typeof anyItem.id === "string") {
              const ref: StoredCardRef = {
                id: anyItem.id,
                collectedAt: new Date(anyItem.collectedAt ?? new Date()).toISOString(),
              }
              return ref
            }
            return null
          })
          .filter((v): v is StoredCardRef => !!v)
      }
    } catch {
      refs = []
    }
  }

  const exists = refs.find((r) => r.id === card.id)
  if (exists) return

  const collectedAtIso = new Date(card.collectedAt ?? new Date()).toISOString()
  const newRef: StoredCardRef = { id: card.id, collectedAt: collectedAtIso }
  if (imageDataUrl) {
    newRef.imageDataUrl = imageDataUrl
  }
  refs.push(newRef)

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refs))

    // Update stats based on this new scan
    try {
      const currentStats = getStats()

      const today = new Date()
      const todayKey = today.toISOString().slice(0, 10) // YYYY-MM-DD
      const lastActiveKey = currentStats.lastActiveDate

      let newStreak = currentStats.streak ?? 0
      if (!lastActiveKey) {
        newStreak = 1
      } else {
        const last = new Date(lastActiveKey)
        const diffMs = today.setHours(0, 0, 0, 0) - last.setHours(0, 0, 0, 0)
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
          // Same day, keep streak
        } else if (diffDays === 1) {
          newStreak = (newStreak || 0) + 1
        } else if (diffDays > 1) {
          newStreak = 1
        }
      }

      const weekProgress = [...(currentStats.weekProgress || [])]
      const day = new Date().getDay() // 0 = Sun, 1 = Mon, ...
      const dayIndex = day === 0 ? 6 : day - 1 // convert to Mon=0 .. Sun=6

      while (weekProgress.length < 7) {
        weekProgress.push(Array.from({ length: 5 }, () => 0))
      }

      // Derive today's activity level from how many words were collected today
      const todayCount = refs.filter((ref) => ref.collectedAt.slice(0, 10) === todayKey).length

      // Map counts to an intensity level: 0 (none), 1 (low), 2 (medium), 3 (high)
      let todayLevel = 0
      if (todayCount > 0 && todayCount <= 2) todayLevel = 1
      else if (todayCount <= 5) todayLevel = 2
      else if (todayCount > 5) todayLevel = 3

      const row = Array.from({ length: 5 }, () => todayLevel)
      weekProgress[dayIndex] = row

      const wordsCollected = refs.length

      updateStats({
        weekProgress,
        streak: newStreak,
        wordsCollected,
        lastActiveDate: todayKey,
      })
    } catch {
      // ignore stats failures
    }
  }
}

export function getStats(): UserStats {
  if (typeof window === "undefined") {
    return {
      totalTime: 0,
      wordsCollected: 0,
      weekProgress: Array.from({ length: 7 }, () => Array.from({ length: 5 }, () => 0)),
      streak: 0,
    }
  }
  const stored = localStorage.getItem(STATS_KEY)
  if (!stored) {
    const defaultStats: UserStats = {
      totalTime: 0,
      wordsCollected: getCollectedCards().length,
      weekProgress: Array.from({ length: 7 }, () => Array.from({ length: 5 }, () => 0)),
      streak: 0,
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats))
    return defaultStats
  }
  try {
    const parsed = JSON.parse(stored) as UserStats

    if (!parsed.weekProgress || parsed.weekProgress.length !== 7) {
      parsed.weekProgress = Array.from({ length: 7 }, () => Array.from({ length: 5 }, () => 0))
    }

    if (typeof parsed.streak !== "number") {
      parsed.streak = 0
    }

    if (typeof parsed.totalTime !== "number") {
      parsed.totalTime = 0
    }

    if (typeof parsed.wordsCollected !== "number") {
      parsed.wordsCollected = getCollectedCards().length
    }

    // Migration: if lastActiveDate is missing, treat this as legacy/mock data and reset
    if (!parsed.lastActiveDate) {
      parsed.weekProgress = Array.from({ length: 7 }, () => Array.from({ length: 5 }, () => 0))
      parsed.streak = 0
      parsed.totalTime = 0
    }

    return parsed
  } catch {
    const fallback: UserStats = {
      totalTime: 0,
      wordsCollected: getCollectedCards().length,
      weekProgress: Array.from({ length: 7 }, () => Array.from({ length: 5 }, () => 0)),
      streak: 0,
    }
    localStorage.setItem(STATS_KEY, JSON.stringify(fallback))
    return fallback
  }
}

export function updateStats(updates: Partial<UserStats>): void {
  const current = getStats()
  const updated = { ...current, ...updates }
  localStorage.setItem(STATS_KEY, JSON.stringify(updated))
}

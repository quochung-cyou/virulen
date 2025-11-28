export interface WordCard {
  id: string
  word: string
  vietnameseMeaning: string
  pronunciation: string
  phonetic: string
  exampleSentences: string[]
  capturedImages: string[]
  cardImages?: string[]
  collectedAt: Date
  category: string
}

export interface CardDictionaryEntry {
  id: string
  labels: string[]
  base: Omit<WordCard, "id" | "collectedAt">
  defaultCollectedAt?: string
}

export function createWordCardInstance(entry: CardDictionaryEntry, collectedAt?: Date): WordCard {
  const effectiveCollectedAt = collectedAt ?? (entry.defaultCollectedAt ? new Date(entry.defaultCollectedAt) : new Date())
  return {
    id: entry.id,
    collectedAt: effectiveCollectedAt,
    ...entry.base,
  }
}

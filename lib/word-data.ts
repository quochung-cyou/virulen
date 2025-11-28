import type { WordCard } from "./card-types"
import { createWordCardInstance } from "./card-types"
import { getAllCardDefinitions } from "./card-dictionary"

export type { WordCard }

const definitions = getAllCardDefinitions()

export const mockWordCards: WordCard[] = definitions.map((entry) =>
  createWordCardInstance(entry, entry.defaultCollectedAt ? new Date(entry.defaultCollectedAt) : undefined),
)

export const scanableObjects = definitions.flatMap((entry, index) =>
  entry.labels.map((keyword) => ({ keyword, word: mockWordCards[index] })),
)

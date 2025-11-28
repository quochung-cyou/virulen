import type { CardDictionaryEntry } from "./card-types"
import rawDefinitions from "./card-dictionary.json"

const CARD_DEFINITIONS: CardDictionaryEntry[] = (rawDefinitions as CardDictionaryEntry[]).map((entry) => ({
  ...entry,
  labels: entry.labels.map((l) => l.trim()).filter((l) => l.length > 0),
}))

const labelIndex = new Map<string, CardDictionaryEntry>()
const idIndex = new Map<string, CardDictionaryEntry>()

for (const entry of CARD_DEFINITIONS) {
  idIndex.set(entry.id, entry)
  for (const label of entry.labels) {
    const key = label.trim().toLowerCase()
    if (!key) continue
    if (!labelIndex.has(key)) {
      labelIndex.set(key, entry)
    }
  }
}

export function getAllCardDefinitions(): CardDictionaryEntry[] {
  return CARD_DEFINITIONS
}

export function getCardDefinitionById(id: string): CardDictionaryEntry | undefined {
  return idIndex.get(id)
}

export function findCardByLabel(label: string | null | undefined): CardDictionaryEntry | undefined {
  if (!label) return undefined
  return labelIndex.get(label.trim().toLowerCase())
}

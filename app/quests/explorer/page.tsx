"use client"

import { useCallback, useState } from "react"
import StellarCardGallerySingle, { GalleryCard } from "@/components/ui/3d-image-gallery"
import { FloatingDock } from "@/components/floating-dock"
import { getAllCardDefinitions } from "@/lib/card-dictionary"

function buildActiveQuestCards(): GalleryCard[] {
  const all = getAllCardDefinitions()

  const withImages = all.filter((entry) => entry.base.cardImages && entry.base.cardImages.length > 0)

  const shuffled = [...withImages].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 20)

  return selected.map((entry) => {
    const imagePath = entry.base.cardImages?.[0] ?? "placeholder.svg"
    const imageUrl = imagePath.startsWith("/") ? imagePath : `/${imagePath}`

    return {
      id: entry.id,
      imageUrl,
      alt: entry.base.word,
      title: entry.base.word,
    }
  })
}

export default function QuestExplorerPage() {
  const [cards, setCards] = useState<GalleryCard[]>(() => buildActiveQuestCards())

  const handleRandomize = useCallback(() => {
    setCards(buildActiveQuestCards())
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      <StellarCardGallerySingle cards={cards} onRandomize={handleRandomize} />
      <FloatingDock />
    </div>
  )
}


import { getAllCardDefinitions } from "@/lib/card-dictionary"
import CardDetailClient from "./CardDetailClient"

export function generateStaticParams() {
  const cards = getAllCardDefinitions()
  return cards.map((card) => ({ id: card.id }))
}

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CardDetailClient id={id} />
}

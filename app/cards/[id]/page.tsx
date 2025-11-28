import { getAllCardDefinitions } from "@/lib/card-dictionary"
import CardDetailClient from "./CardDetailClient"

export function generateStaticParams() {
  const cards = getAllCardDefinitions()
  return cards.map((card) => ({ id: card.id }))
}

export default function CardDetailPage({ params }: { params: { id: string } }) {
  return <CardDetailClient id={params.id} />
}

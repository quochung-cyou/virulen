"use client"

import { motion } from "framer-motion"

interface Card {
  id: string
  word: string
  vietnameseMeaning: string
  pronunciation: string
  category: string
  capturedImages: string[]
}

interface CardStackProps {
  cards: Card[]
  phase: "visible" | "dissolving"
}

const stackSettings = {
  offset: 8,
  scaleStep: 0.05,
  dimStep: 0.12,
}

const dissolveEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export function CardStack({ cards, phase }: CardStackProps) {
  if (!cards.length) {
    return null
  }

  const isDissolving = phase === "dissolving"

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto aspect-[4/3]"
      animate={{
        opacity: isDissolving ? 0 : 1,
        scale: isDissolving ? 0.94 : 1,
        y: isDissolving ? 24 : 0,
      }}
      transition={{ duration: 0.65, ease: dissolveEase }}
    >
      <ul className="relative w-full h-full m-0 p-0">
        {cards.map(({ id, word, vietnameseMeaning, category, capturedImages }, i) => {
          const brightness = Math.max(0.35, 1 - i * stackSettings.dimStep)
          const baseZ = cards.length - i
          const cardImage = capturedImages[0] || "/vocabulary-word.jpg"

          return (
            <motion.li
              key={id}
              className="absolute w-full h-full list-none overflow-hidden border border-border/80 rounded-2xl shadow-xl"
              style={{ pointerEvents: "none" }}
              initial={{
                top: `${i * -stackSettings.offset}%`,
                scale: 1 - i * stackSettings.scaleStep,
                filter: `brightness(${brightness})`,
                zIndex: baseZ,
                opacity: 0,
              }}
              animate={{
                top: `${i * -stackSettings.offset}%`,
                scale: 1 - i * stackSettings.scaleStep,
                filter: `brightness(${brightness})`,
                zIndex: baseZ,
                opacity: isDissolving ? 0 : 1,
              }}
              transition={{ duration: 0.6, ease: dissolveEase }}
            >
              <div className="relative w-full h-full bg-card rounded-2xl overflow-hidden">
                <img
                  src={cardImage || "/placeholder.svg"}
                  alt={word}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg">{word}</h3>
                  <p className="text-white/80 text-sm">{vietnameseMeaning}</p>
                  <p className="text-white/60 text-xs mt-1">{category}</p>
                </div>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </motion.div>
  )
}

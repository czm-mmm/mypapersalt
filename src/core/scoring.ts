import type { Card, CardColor, CardKind } from './types'
import { COLOR_META } from './cards'

export interface ScoreBreakdown {
  duo: number
  collector: number
  multiplier: number
  mermaid: number
  total: number
  colorBonus: number
}

const TABLES: Partial<Record<CardKind, number[]>> = {
  shell: [0, 0, 2, 4, 6, 8, 10],
  octopus: [0, 0, 3, 6, 9, 12],
  penguin: [0, 1, 3, 5],
  sailor: [0, 0, 5],
}

export function countKind(cards: Card[], kind: CardKind): number {
  return cards.filter((card) => card.kind === kind).length
}

export function colorCounts(cards: Card[]): Record<CardColor, number> {
  const result = Object.fromEntries(Object.keys(COLOR_META).map((color) => [color, 0])) as Record<CardColor, number>
  for (const card of cards) result[card.color] += 1
  return result
}

export function scoreCards(cards: Card[]): ScoreBreakdown {
  const crab = countKind(cards, 'crab')
  const boat = countKind(cards, 'boat')
  const fish = countKind(cards, 'fish')
  const shark = countKind(cards, 'shark')
  const swimmer = countKind(cards, 'swimmer')
  const duo = Math.floor(crab / 2) + Math.floor(boat / 2) + Math.floor(fish / 2) + Math.min(shark, swimmer)

  let collector = 0
  for (const [kind, table] of Object.entries(TABLES) as Array<[CardKind, number[]]>) {
    collector += table[countKind(cards, kind)] ?? 0
  }

  const multiplier =
    countKind(cards, 'lighthouse') * boat +
    countKind(cards, 'shoal') * fish +
    countKind(cards, 'penguin-colony') * countKind(cards, 'penguin') * 2 +
    countKind(cards, 'captain') * countKind(cards, 'sailor') * 3

  const colors = Object.values(colorCounts(cards)).sort((a, b) => b - a)
  const mermaidCount = countKind(cards, 'mermaid')
  const mermaid = colors.slice(0, mermaidCount).reduce((sum, count) => sum + count, 0)
  const colorBonus = colors[0] ?? 0
  return { duo, collector, multiplier, mermaid, total: duo + collector + multiplier + mermaid, colorBonus }
}


import { describe, expect, it } from 'vitest'
import { createDeck } from '../cards'
import { scoreCards } from '../scoring'

function take(kind: ReturnType<typeof createDeck>[number]['kind'], count: number) {
  return createDeck().filter((card) => card.kind === kind).slice(0, count)
}

describe('计分', () => {
  it('按规则计算Duo和收藏牌', () => {
    const cards = [...take('crab', 3), ...take('boat', 2), ...take('shell', 4), ...take('octopus', 3)]
    const score = scoreCards(cards)
    expect(score.duo).toBe(2)
    expect(score.collector).toBe(12)
  })

  it('加成牌不把自身当成对应类型', () => {
    const cards = [...take('boat', 4), ...take('lighthouse', 1), ...take('penguin', 2), ...take('penguin-colony', 1)]
    const score = scoreCards(cards)
    expect(score.multiplier).toBe(8)
  })

  it('多张美人鱼使用不同颜色组', () => {
    const deck = createDeck()
    const cards = [
      ...deck.filter((card) => card.color === 'deep-blue').slice(0, 4),
      ...deck.filter((card) => card.color === 'yellow').slice(0, 3),
      ...take('mermaid', 2),
    ]
    const score = scoreCards(cards)
    expect(score.mermaid).toBe(7)
    expect(score.colorBonus).toBe(4)
  })
})


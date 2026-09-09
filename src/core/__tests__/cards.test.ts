import { describe, expect, it } from 'vitest'
import { COLLECTOR_SCORE_GUIDES, collectorCardValue, countDeckColors, createDeck, KIND_META } from '../cards'

describe('基础牌组', () => {
  it('包含58张唯一卡牌，并符合牌型数量', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(58)
    expect(new Set(deck.map((card) => card.id)).size).toBe(58)
    for (const [kind, meta] of Object.entries(KIND_META)) {
      expect(deck.filter((card) => card.kind === kind)).toHaveLength(meta.count)
    }
  })

  it('符合基础版11种颜色总数', () => {
    expect(countDeckColors()).toEqual({
      'deep-blue': 9,
      'sky-blue': 9,
      ink: 8,
      yellow: 8,
      'sea-green': 6,
      white: 4,
      purple: 4,
      mist: 4,
      peach: 3,
      pink: 2,
      orange: 1,
    })
  })

  it('任何卡牌画面最多展示两个同类主体', () => {
    expect(createDeck().every((card) => card.artCount === 1 || card.artCount === 2)).toBe(true)
  })

  it('收藏牌右上角显示正确的累计分值', () => {
    const deck = createDeck()
    const values = (kind: string) => deck.filter((card) => card.kind === kind).map(collectorCardValue)

    expect(values('shell')).toEqual([0, 2, 4, 6, 8, 10])
    expect(values('octopus')).toEqual([0, 3, 6, 9, 12])
    expect(values('penguin')).toEqual([1, 3, 5])
    expect(values('sailor')).toEqual([0, 5])
  })

  it('每张收藏牌共享所属类别的完整累计计分提示', () => {
    expect(COLLECTOR_SCORE_GUIDES.shell?.join('／')).toBe('0／2／4／6／8／10')
    expect(COLLECTOR_SCORE_GUIDES.octopus?.join('／')).toBe('0／3／6／9／12')
    expect(COLLECTOR_SCORE_GUIDES.penguin?.join('／')).toBe('1／3／5')
    expect(COLLECTOR_SCORE_GUIDES.sailor?.join('／')).toBe('0／5')
  })
})

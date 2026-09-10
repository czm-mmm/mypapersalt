import type { Card, CardColor, CardKind } from './types'

export const KIND_META: Record<CardKind, { name: string; short: string; count: number; rule: string }> = {
  crab: { name: '螃蟹', short: '双蟹', count: 9, rule: '两张：查看一个弃牌堆并取任意一张' },
  boat: { name: '船', short: '双船', count: 8, rule: '两张：立即再进行一回合' },
  fish: { name: '鱼', short: '双鱼', count: 7, rule: '两张：从牌库顶拿一张' },
  shark: { name: '鲨鱼', short: '猎手', count: 5, rule: '与游泳者：随机偷取对手一张手牌' },
  swimmer: { name: '游泳者', short: '泳者', count: 5, rule: '与鲨鱼：随机偷取对手一张手牌' },
  mermaid: { name: '美人鱼', short: '潮汐', count: 4, rule: '按最多颜色计分；集齐四张立即获胜' },
  shell: { name: '贝壳', short: '收藏', count: 6, rule: '1–6张：0 / 2 / 4 / 6 / 8 / 10分' },
  octopus: { name: '章鱼', short: '收藏', count: 5, rule: '1–5张：0 / 3 / 6 / 9 / 12分' },
  penguin: { name: '企鹅', short: '收藏', count: 3, rule: '1–3张：1 / 3 / 5分' },
  sailor: { name: '水手', short: '收藏', count: 2, rule: '1–2张：0 / 5分' },
  lighthouse: { name: '灯塔', short: '加成', count: 1, rule: '每张船加1分' },
  shoal: { name: '鱼群', short: '加成', count: 1, rule: '每张鱼加1分' },
  'penguin-colony': { name: '企鹅群落', short: '加成', count: 1, rule: '每张企鹅加2分' },
  captain: { name: '船长', short: '加成', count: 1, rule: '每张水手加3分' },
}

// 收藏牌右上角印刷的数字：拿到该类别第 N 张时，该类别牌的累计总分。
export const COLLECTOR_CARD_VALUES: Partial<Record<CardKind, number[]>> = {
  shell: [0, 2, 4, 6, 8, 10],
  octopus: [0, 3, 6, 9, 12],
  penguin: [1, 3, 5],
  sailor: [0, 5],
}

// 同类收藏牌共享的累计计分提示，卡面按从左到右、从上到下的顺序读取。
export const COLLECTOR_SCORE_GUIDES: Partial<Record<CardKind, readonly string[]>> = {
  shell: ['0', '2', '4', '6', '8', '10'],
  octopus: ['0', '3', '6', '9', '12'],
  penguin: ['1', '3', '5'],
  sailor: ['0', '5'],
}

export function collectorCardValue(card: Card): number | null {
  const values = COLLECTOR_CARD_VALUES[card.kind]
  if (!values) return null
  const copyNumber = Number(card.id.slice(card.id.lastIndexOf('-') + 1))
  return values[copyNumber - 1] ?? null
}

export const COLOR_META: Record<CardColor, { name: string; a: string; b: string; ink: string }> = {
  'deep-blue': { name: '深海蓝', a: '#185d88', b: '#0f3f68', ink: '#ffffff' },
  'sky-blue': { name: '浅海蓝', a: '#72d3dd', b: '#45b8cc', ink: '#083d4a' },
  ink: { name: '墨黑', a: '#354550', b: '#172831', ink: '#ffffff' },
  yellow: { name: '沙黄', a: '#f6dc78', b: '#efbd55', ink: '#514114' },
  'sea-green': { name: '海草绿', a: '#79c7a7', b: '#48a886', ink: '#123f37' },
  white: { name: '浪花白', a: '#fffdf6', b: '#e8edf0', ink: '#274052' },
  purple: { name: '珊瑚紫', a: '#aaa0d8', b: '#806eb9', ink: '#ffffff' },
  mist: { name: '雾灰', a: '#c6d2d2', b: '#9db1b2', ink: '#253a40' },
  peach: { name: '浅橙', a: '#f5ba8c', b: '#e99a6b', ink: '#57321e' },
  pink: { name: '贝粉', a: '#efadc1', b: '#df789e', ink: '#5b233d' },
  orange: { name: '日落橙', a: '#ef8b4f', b: '#d86532', ink: '#ffffff' },
}

// 基础版牌型数量与11种颜色总数严格匹配公开资料。
// 逐张颜色关联独立放在这里，便于之后拿实体牌逐张复核时仅替换数据。
const BLUEPRINTS: Array<[CardKind, CardColor[]]> = [
  ['crab', ['deep-blue', 'deep-blue', 'sky-blue', 'sky-blue', 'ink', 'yellow', 'sea-green', 'mist', 'purple']],
  ['boat', ['deep-blue', 'deep-blue', 'sky-blue', 'ink', 'yellow', 'yellow', 'sea-green', 'pink']],
  ['fish', ['deep-blue', 'sky-blue', 'sky-blue', 'ink', 'yellow', 'sea-green', 'purple']],
  ['shark', ['deep-blue', 'sky-blue', 'ink', 'ink', 'mist']],
  ['swimmer', ['sky-blue', 'ink', 'yellow', 'sea-green', 'pink']],
  ['mermaid', ['white', 'white', 'white', 'white']],
  ['shell', ['deep-blue', 'sky-blue', 'yellow', 'purple', 'peach', 'peach']],
  ['octopus', ['deep-blue', 'sky-blue', 'ink', 'purple', 'orange']],
  ['penguin', ['ink', 'mist', 'yellow']],
  ['sailor', ['sea-green', 'peach']],
  ['lighthouse', ['yellow']],
  ['shoal', ['deep-blue']],
  ['penguin-colony', ['mist']],
  ['captain', ['sea-green']],
]

const CARD_KIND_OFFSETS: Record<CardKind, number> = {
  crab: 0,
  boat: 9,
  fish: 17,
  shark: 24,
  swimmer: 29,
  mermaid: 34,
  shell: 38,
  octopus: 44,
  penguin: 49,
  sailor: 52,
  lighthouse: 54,
  shoal: 55,
  'penguin-colony': 56,
  captain: 57,
}

/** 返回该实体牌对应的最终成品牌面 PNG 文件名。 */
export function cardImageFileName(card: Card): string {
  const copyNumber = Number(card.id.slice(card.id.lastIndexOf('-') + 1))
  const deckNumber = CARD_KIND_OFFSETS[card.kind] + copyNumber
  return `${String(deckNumber).padStart(2, '0')}_${card.id}_${card.color}.png`
}

export function createDeck(): Card[] {
  const cards: Card[] = []
  for (const [kind, colors] of BLUEPRINTS) {
    colors.forEach((color, index) => {
      cards.push({
        id: `${kind}-${index + 1}`,
        kind,
        color,
        artCount: index % 3 === 1 ? 2 : 1,
      })
    })
  }
  return cards
}

export function countDeckColors(cards = createDeck()): Record<CardColor, number> {
  const result = Object.fromEntries(Object.keys(COLOR_META).map((color) => [color, 0])) as Record<CardColor, number>
  for (const card of cards) result[card.color] += 1
  return result
}

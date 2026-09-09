import { describe, expect, it } from 'vitest'
import { createDeck } from '../cards'
import {
  callLastChance,
  callStop,
  createGame,
  drawTwo,
  endTurn,
  keepDrawnCard,
  placePendingDiscard,
  playDuo,
  stealRandomCard,
  takeDiscardTop,
} from '../engine'

function cards(kind: ReturnType<typeof createDeck>[number]['kind'], count: number) {
  return createDeck().filter((card) => card.kind === kind).slice(0, count)
}

describe('规则引擎', () => {
  it('开局形成牌库与两个弃牌堆', () => {
    const state = createGame(3, 7)
    expect(state.deck).toHaveLength(56)
    expect(state.discards[0]).toHaveLength(1)
    expect(state.discards[1]).toHaveLength(1)
  })

  it('开局首位玩家按随机种子决定', () => {
    const starters = new Set([1, 123456789, 987654321, 2147483647, 4294967295].map((seed) => {
      const state = createGame(4, seed)
      expect(state.currentPlayer).toBe(state.startingPlayer)
      return state.startingPlayer
    }))
    expect(starters.size).toBeGreaterThan(1)
  })

  it('STOP后所有玩家按牌面分获得分数', () => {
    const state = createGame(2, 8)
    state.currentPlayer = 0
    state.players[0].hand = cards('shell', 6)
    state.players[1].hand = cards('octopus', 3)
    state.phase = 'duo'
    callStop(state)
    expect(state.phase).toBe('round-result')
    expect(state.roundScores.map((result) => result.awarded)).toEqual([10, 6])
  })

  it('最后机会平分也算发起者成功', () => {
    const state = createGame(2, 9)
    state.currentPlayer = 0
    state.players[0].hand = cards('shell', 6)
    state.players[1].hand = cards('shell', 6)
    state.phase = 'duo'
    callLastChance(state)
    state.phase = 'duo'
    endTurn(state)
    expect(state.roundScores[0].note).toContain('押注成功')
    expect(state.roundScores[1].awarded).toBe(state.roundScores[1].colorBonus)
  })

  it('集齐四张美人鱼立即获胜', () => {
    const state = createGame(2, 10)
    state.currentPlayer = 0
    state.players[0].hand = cards('mermaid', 3)
    const fourth = cards('mermaid', 4)[3]
    state.discards[0].push(fourth)
    takeDiscardTop(state, 0)
    expect(state.phase).toBe('game-over')
    expect(state.winnerIds).toEqual([0])
  })

  it('拿取公开弃牌后记录其手牌归属', () => {
    const state = createGame(3, 13)
    state.currentPlayer = 0
    const visible = state.discards[0].at(-1)!
    takeDiscardTop(state, 0)
    expect(state.publicKnownHands[0]).toContain(visible.id)
  })

  it('发生随机偷牌后撤销旁观者无法确定的手牌归属', () => {
    const state = createGame(3, 14)
    state.currentPlayer = 0
    const visible = state.discards[0].at(-1)!
    takeDiscardTop(state, 0)
    state.currentPlayer = 1
    state.players[1].hand = [...cards('shark', 1), ...cards('swimmer', 1)]
    state.phase = 'duo'
    playDuo(state, 'shark-swimmer')
    stealRandomCard(state, 0)
    expect(state.publicKnownHands[0]).toEqual([])
    expect(state.players[0].hand).not.toContainEqual(visible)
  })

  it('多组双船会累积额外回合，最后机会中也不会被吞掉', () => {
    const state = createGame(2, 11)
    state.currentPlayer = 0
    state.players[0].hand = cards('shell', 6)
    state.phase = 'duo'
    callLastChance(state)
    state.players[1].hand = cards('boat', 4)
    state.phase = 'duo'
    playDuo(state, 'boat')
    playDuo(state, 'boat')
    expect(state.extraTurns).toBe(2)
    endTurn(state)
    expect(state.currentPlayer).toBe(1)
    expect(state.phase).toBe('draw')
    expect(state.extraTurns).toBe(1)
  })

  it('发起最后机会时不会把自己尚未使用的额外回合转给下家', () => {
    const state = createGame(3, 15)
    state.currentPlayer = 0
    state.players[0].hand = [...cards('shell', 6), ...cards('boat', 2)]
    state.phase = 'duo'
    playDuo(state, 'boat')
    expect(state.extraTurns).toBe(1)
    callLastChance(state)
    expect(state.currentPlayer).toBe(1)
    expect(state.extraTurns).toBe(0)
  })

  it('同类牌较多时可以指定具体哪两张打到面前', () => {
    const state = createGame(2, 16)
    state.currentPlayer = 0
    const threeBoats = cards('boat', 3)
    state.players[0].hand = [...threeBoats]
    state.phase = 'duo'
    playDuo(state, 'boat', [threeBoats[1].id, threeBoats[2].id])
    expect(state.players[0].played.map((card) => card.id)).toEqual([threeBoats[1].id, threeBoats[2].id])
    expect(state.players[0].hand.map((card) => card.id)).toEqual([threeBoats[0].id])
  })

  it('总分相同时以上一轮得分打破终局平分', () => {
    const state = createGame(2, 12)
    state.currentPlayer = 0
    state.players[0].totalScore = 33
    state.players[1].totalScore = 30
    state.players[0].hand = [...cards('shell', 4), ...cards('crab', 2)]
    state.players[1].hand = cards('shell', 6)
    state.phase = 'duo'
    callStop(state)
    expect(state.players.map((player) => player.totalScore)).toEqual([40, 40])
    expect(state.winnerIds).toEqual([1])
  })

  it('牌库不足两张时不能自创单张抽牌流程', () => {
    const state = createGame(2, 17)
    state.currentPlayer = 0
    state.deck = state.deck.slice(0, 1)
    state.phase = 'draw'
    expect(() => drawTwo(state)).toThrow('牌库不足两张')
  })

  it('两个弃牌堆都为空时仍可任选一个放置未保留的牌', () => {
    const state = createGame(2, 18)
    state.currentPlayer = 0
    state.discards = [[], []]
    state.phase = 'draw'
    drawTwo(state)
    keepDrawnCard(state, state.drawnChoices[0].id)
    placePendingDiscard(state, 1)
    expect(state.discards[0]).toHaveLength(0)
    expect(state.discards[1]).toHaveLength(1)
  })

  it('回合结束时牌库为空会立即零分结算，不能再宣布结束', () => {
    const state = createGame(2, 19)
    state.currentPlayer = 0
    state.players[0].hand = cards('shell', 6)
    state.deck = []
    state.phase = 'duo'
    expect(() => callStop(state)).toThrow('当前不能宣布停止')
    endTurn(state)
    expect(state.phase).toBe('round-result')
    expect(state.roundScores.map((result) => result.awarded)).toEqual([0, 0])
  })
})

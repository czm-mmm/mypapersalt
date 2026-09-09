import { createDeck } from './cards'
import { scoreCards } from './scoring'
import type { Card, DuoKind, GameState, PlayerState, RoundScore } from './types'

function nextRandom(state: GameState): number {
  let x = state.seed | 0
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  state.seed = x >>> 0
  return state.seed / 4294967296
}

function shuffle(state: GameState, cards: Card[]): Card[] {
  const copy = [...cards]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(nextRandom(state) * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

function targetScore(playerCount: number): number {
  return playerCount === 2 ? 40 : playerCount === 3 ? 35 : 30
}

export function allCards(player: PlayerState): Card[] {
  return [...player.hand, ...player.played]
}

export function createGame(playerCount = 3, seed = Date.now()): GameState {
  if (playerCount < 2 || playerCount > 4) throw new Error('仅支持2至4名玩家')
  const players: PlayerState[] = Array.from({ length: playerCount }, (_, id) => ({
    id,
    name: id === 0 ? '你' : ['潮汐', '白帆', '珊瑚'][id - 1],
    isHuman: id === 0,
    hand: [],
    played: [],
    totalScore: 0,
    lastRoundScore: 0,
  }))
  const state: GameState = {
    players,
    deck: [],
    discards: [[], []],
    currentPlayer: 0,
    startingPlayer: 0,
    roundNumber: 1,
    phase: 'draw',
    drawnChoices: [],
    pendingDiscard: null,
    extraTurns: 0,
    lastChanceCaller: null,
    lastChanceQueue: null,
    protectedPlayers: [],
    publicKnownHands: players.map(() => []),
    roundEndedBy: null,
    roundScores: [],
    winnerIds: [],
    message: '从牌库抽两张，或拿一个弃牌堆顶。',
    seed: seed >>> 0 || 1,
  }
  setupRound(state)
  state.startingPlayer = Math.floor(nextRandom(state) * playerCount)
  state.currentPlayer = state.startingPlayer
  state.message = `${state.players[state.currentPlayer].name}随机成为首位玩家。选择牌库，或拿一个弃牌堆顶。`
  return state
}

function setupRound(state: GameState): void {
  for (const player of state.players) {
    player.hand = []
    player.played = []
    player.lastRoundScore = 0
  }
  state.deck = shuffle(state, createDeck())
  state.discards = [[state.deck.pop()!], [state.deck.pop()!]]
  state.currentPlayer = state.startingPlayer
  state.phase = 'draw'
  state.drawnChoices = []
  state.pendingDiscard = null
  state.extraTurns = 0
  state.lastChanceCaller = null
  state.lastChanceQueue = null
  state.protectedPlayers = []
  state.publicKnownHands = state.players.map(() => [])
  state.roundEndedBy = null
  state.roundScores = []
  state.message = `${state.players[state.currentPlayer].name}先手：选择牌库，或拿一个弃牌堆顶。`
}

function assertPhase(state: GameState, phase: GameState['phase']): void {
  if (state.phase !== phase) throw new Error(`当前阶段不能执行此动作：${state.phase}`)
}

function checkMermaidWin(state: GameState, playerId = state.currentPlayer): boolean {
  const count = allCards(state.players[playerId]).filter((card) => card.kind === 'mermaid').length
  if (count < 4) return false
  state.winnerIds = [playerId]
  state.phase = 'game-over'
  state.message = `${state.players[playerId].name}集齐四张美人鱼，立即获胜！`
  return true
}

export function drawTwo(state: GameState): void {
  assertPhase(state, 'draw')
  if (state.deck.length < 2) throw new Error('牌库不足两张，请从弃牌堆拿牌。')
  state.drawnChoices = [state.deck.pop()!, state.deck.pop()!]
  state.phase = 'choose-drawn'
  state.message = '选择一张留下。'
}

export function keepDrawnCard(state: GameState, cardId: string): void {
  assertPhase(state, 'choose-drawn')
  const kept = state.drawnChoices.find((card) => card.id === cardId)
  const other = state.drawnChoices.find((card) => card.id !== cardId)
  if (!kept || !other) throw new Error('抽牌选择无效')
  state.players[state.currentPlayer].hand.push(kept)
  state.pendingDiscard = other
  state.drawnChoices = []
  state.phase = 'choose-discard'
  state.message = '将另一张放到一个弃牌堆。'
  checkMermaidWin(state)
}

export function placePendingDiscard(state: GameState, pile: 0 | 1): void {
  assertPhase(state, 'choose-discard')
  if (!state.pendingDiscard) throw new Error('没有待弃置的牌')
  const emptyPiles = state.discards
    .map((cards, index) => cards.length === 0 ? index as 0 | 1 : null)
    .filter((index): index is 0 | 1 => index !== null)
  if (emptyPiles.length === 1 && pile !== emptyPiles[0]) throw new Error('有一个弃牌堆为空时，必须将牌放入该空堆')
  state.discards[pile].push(state.pendingDiscard)
  state.pendingDiscard = null
  state.phase = 'duo'
  state.message = '可以发动组合，或结束本回合。'
}

export function takeDiscardTop(state: GameState, pile: 0 | 1): void {
  assertPhase(state, 'draw')
  const card = state.discards[pile].pop()
  if (!card) throw new Error('这个弃牌堆是空的')
  state.players[state.currentPlayer].hand.push(card)
  state.publicKnownHands[state.currentPlayer].push(card.id)
  state.phase = 'duo'
  state.message = '可以发动组合，或结束本回合。'
  checkMermaidWin(state)
}

export function playableDuos(state: GameState): DuoKind[] {
  const hand = state.players[state.currentPlayer].hand
  const count = (kind: Card['kind']) => hand.filter((card) => card.kind === kind).length
  const result: DuoKind[] = []
  if (count('crab') >= 2) result.push('crab')
  if (count('boat') >= 2) result.push('boat')
  if (count('fish') >= 2) result.push('fish')
  if (count('shark') >= 1 && count('swimmer') >= 1) result.push('shark-swimmer')
  return result
}

function moveKindsToPlayed(state: GameState, kinds: Card['kind'][], cardIds?: string[]): void {
  const player = state.players[state.currentPlayer]
  const selected = cardIds
    ? cardIds.map((id) => player.hand.find((card) => card.id === id))
    : kinds.map((kind, index) => player.hand.filter((card) => card.kind === kind)[kinds.slice(0, index).filter((item) => item === kind).length])

  if (selected.length !== kinds.length || selected.some((card) => !card) || new Set(cardIds ?? []).size !== (cardIds?.length ?? 0)) {
    throw new Error('请选择正确数量的组合牌')
  }
  const expectedKinds = [...kinds].sort()
  const selectedKinds = selected.map((card) => card!.kind).sort()
  if (selectedKinds.some((kind, index) => kind !== expectedKinds[index])) throw new Error('所选卡牌不符合该组合')

  for (const selectedCard of selected) {
    const index = player.hand.findIndex((card) => card.id === selectedCard!.id)
    if (index < 0) throw new Error('手牌中没有所需组合')
    const [card] = player.hand.splice(index, 1)
    player.played.push(card)
    state.publicKnownHands[player.id] = state.publicKnownHands[player.id].filter((id) => id !== card.id)
  }
}

export function playDuo(state: GameState, duo: DuoKind, cardIds?: string[]): void {
  assertPhase(state, 'duo')
  if (!playableDuos(state).includes(duo)) throw new Error('该组合当前不可用')
  if (duo === 'crab') {
    moveKindsToPlayed(state, ['crab', 'crab'], cardIds)
    if (state.discards[0].length + state.discards[1].length === 0) return
    state.phase = 'crab-pick'
    state.message = '选择一个弃牌堆中的任意一张牌。'
  } else if (duo === 'boat') {
    moveKindsToPlayed(state, ['boat', 'boat'], cardIds)
    state.extraTurns += 1
    state.message = '双船发动：本回合结束后你会立即再行动一次。'
  } else if (duo === 'fish') {
    moveKindsToPlayed(state, ['fish', 'fish'], cardIds)
    const card = state.deck.pop()
    if (card) state.players[state.currentPlayer].hand.push(card)
    state.message = card ? '双鱼发动：从牌库顶拿到一张牌。' : '牌库已经空了。'
    checkMermaidWin(state)
  } else {
    moveKindsToPlayed(state, ['shark', 'swimmer'], cardIds)
    const targets = stealTargets(state)
    if (targets.length) {
      state.phase = 'steal-target'
      state.message = '选择一名玩家，随机偷取一张手牌。'
    } else {
      state.message = '没有可以被偷取的手牌。'
    }
  }
}

export function takeCrabCard(state: GameState, pile: 0 | 1, cardId: string): void {
  assertPhase(state, 'crab-pick')
  const index = state.discards[pile].findIndex((card) => card.id === cardId)
  if (index < 0) throw new Error('弃牌堆中没有这张牌')
  state.players[state.currentPlayer].hand.push(...state.discards[pile].splice(index, 1))
  state.phase = 'duo'
  state.message = '螃蟹组合完成，可以继续发动组合。'
  checkMermaidWin(state)
}

export function stealTargets(state: GameState): number[] {
  return state.players
    .filter((player) => player.id !== state.currentPlayer && player.hand.length > 0 && !state.protectedPlayers.includes(player.id))
    .map((player) => player.id)
}

export function stealRandomCard(state: GameState, targetId: number): void {
  assertPhase(state, 'steal-target')
  if (!stealTargets(state).includes(targetId)) throw new Error('该玩家不能被偷取')
  const target = state.players[targetId]
  const index = Math.floor(nextRandom(state) * target.hand.length)
  state.players[state.currentPlayer].hand.push(...target.hand.splice(index, 1))
  // 旁观者只知道目标少了一张，却不知道随机拿走的是哪张；旧的确切归属因此全部失效。
  state.publicKnownHands[targetId] = []
  state.phase = 'duo'
  state.message = `从${target.name}手中随机取得一张牌。`
  checkMermaidWin(state)
}

export function canCall(state: GameState): boolean {
  return state.phase === 'duo'
    && state.deck.length > 0
    && state.lastChanceQueue === null
    && scoreCards(allCards(state.players[state.currentPlayer])).total >= 7
}

export function endTurn(state: GameState): void {
  assertPhase(state, 'duo')
  if (state.deck.length === 0) {
    finishRound(state, 'empty')
    return
  }

  if (state.extraTurns > 0) {
    state.extraTurns -= 1
  } else if (state.lastChanceQueue !== null) {
    if (!state.protectedPlayers.includes(state.currentPlayer)) state.protectedPlayers.push(state.currentPlayer)
    const next = state.lastChanceQueue.shift()
    if (next === undefined) {
      finishRound(state, 'last-chance')
      return
    }
    state.currentPlayer = next
  } else {
    state.currentPlayer = (state.currentPlayer + 1) % state.players.length
  }
  state.phase = 'draw'
  state.message = `${state.players[state.currentPlayer].name}的回合：选择抽牌来源。`
}

export function callStop(state: GameState): void {
  if (!canCall(state)) throw new Error('当前不能宣布停止')
  state.roundEndedBy = state.currentPlayer
  finishRound(state, 'stop')
}

export function callLastChance(state: GameState): void {
  if (!canCall(state)) throw new Error('当前不能宣布最后机会')
  const caller = state.currentPlayer
  state.lastChanceCaller = caller
  state.roundEndedBy = caller
  // 结束本轮会取消发起者尚未使用的额外回合，不能转移给下一位玩家。
  state.extraTurns = 0
  state.protectedPlayers = [caller]
  const order = Array.from({ length: state.players.length - 1 }, (_, offset) => (caller + offset + 1) % state.players.length)
  state.currentPlayer = order.shift()!
  state.lastChanceQueue = order
  state.phase = 'draw'
  state.message = `最后机会：${state.players[state.currentPlayer].name}进行最后一回合。`
}

function finishRound(state: GameState, mode: 'stop' | 'last-chance' | 'empty'): void {
  const breakdowns = state.players.map((player) => scoreCards(allCards(player)))
  const scores: RoundScore[] = []
  if (mode === 'empty') {
    for (const player of state.players) scores.push({ playerId: player.id, cardPoints: breakdowns[player.id].total, colorBonus: breakdowns[player.id].colorBonus, awarded: 0, note: '牌库耗尽，本轮不计分' })
  } else if (mode === 'stop') {
    for (const player of state.players) scores.push({ playerId: player.id, cardPoints: breakdowns[player.id].total, colorBonus: breakdowns[player.id].colorBonus, awarded: breakdowns[player.id].total, note: 'STOP：按牌面分计分' })
  } else {
    const caller = state.lastChanceCaller!
    const won = state.players.every((player) => player.id === caller || breakdowns[caller].total >= breakdowns[player.id].total)
    for (const player of state.players) {
      let awarded = 0
      let note = ''
      if (won) {
        awarded = player.id === caller ? breakdowns[player.id].total + breakdowns[player.id].colorBonus : breakdowns[player.id].colorBonus
        note = player.id === caller ? '押注成功：牌面分＋颜色奖励' : '发起者押注成功：仅颜色奖励'
      } else {
        awarded = player.id === caller ? breakdowns[player.id].colorBonus : breakdowns[player.id].total
        note = player.id === caller ? '押注失败：仅颜色奖励' : '发起者押注失败：按牌面分计分'
      }
      scores.push({ playerId: player.id, cardPoints: breakdowns[player.id].total, colorBonus: breakdowns[player.id].colorBonus, awarded, note })
    }
  }

  state.roundScores = scores
  for (const score of scores) {
    const player = state.players[score.playerId]
    player.lastRoundScore = score.awarded
    player.totalScore += score.awarded
  }
  const target = targetScore(state.players.length)
  const best = Math.max(...state.players.map((player) => player.totalScore))
  if (state.players.some((player) => player.totalScore >= target)) {
    const tied = state.players.filter((player) => player.totalScore === best)
    const bestLastRound = Math.max(...tied.map((player) => player.lastRoundScore))
    state.winnerIds = tied.filter((player) => player.lastRoundScore === bestLastRound).map((player) => player.id)
    state.phase = 'game-over'
    state.message = `${state.winnerIds.map((id) => state.players[id].name).join('、')}赢得整场游戏！`
  } else {
    state.phase = 'round-result'
    state.message = mode === 'empty' ? '牌库耗尽，本轮无人得分。' : '本轮结算完成。'
  }
}

export function nextRound(state: GameState): void {
  assertPhase(state, 'round-result')
  const endedBy = state.roundEndedBy ?? state.currentPlayer
  state.startingPlayer = (endedBy + 1) % state.players.length
  state.roundNumber += 1
  setupRound(state)
}

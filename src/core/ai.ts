import { createDeck, KIND_META } from './cards'
import {
  allCards,
  callLastChance,
  callStop,
  canCall,
  drawTwo,
  endTurn,
  keepDrawnCard,
  placePendingDiscard,
  playableDuos,
  playDuo,
  stealRandomCard,
  stealTargets,
  takeCrabCard,
  takeDiscardTop,
} from './engine'
import { countKind, scoreCards } from './scoring'
import type { AiDifficulty, Card, DuoKind, GameState } from './types'

type AiAction =
  | { type: 'draw-deck' }
  | { type: 'take-discard'; pile: 0 | 1 }
  | { type: 'keep-drawn'; cardId: string }
  | { type: 'place-discard'; pile: 0 | 1 }
  | { type: 'play-duo'; duo: DuoKind }
  | { type: 'take-crab'; pile: 0 | 1; cardId: string }
  | { type: 'steal'; targetId: number }
  | { type: 'continue' }
  | { type: 'stop' }
  | { type: 'last-chance' }

export const AI_SEARCH_CONFIG = {
  medium: { samples: 300, depth: 4 },
  hard: { samples: 420, depth: 5 },
} as const

function targetScore(playerCount: number): number {
  return playerCount === 2 ? 40 : playerCount === 3 ? 35 : 30
}

function cloneState(state: GameState): GameState {
  // App 中传入的是 Vue 响应式 Proxy，structuredClone 会抛 DataCloneError。
  // 游戏状态只包含可序列化数据，JSON 快照也能隔离每条搜索分支。
  return JSON.parse(JSON.stringify(state)) as GameState
}

function hashText(text: string): number {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0 || 1
}

function makeRng(seed: number): () => number {
  let value = seed >>> 0 || 1
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return (value >>> 0) / 4294967296
  }
}

function decisionSeed(state: GameState, difficulty: AiDifficulty): number {
  const publicShape = [
    difficulty,
    state.seed,
    state.roundNumber,
    state.currentPlayer,
    state.phase,
    state.deck.length,
    state.discards.map((pile) => pile.map((card) => card.id).join(',')).join('|'),
    state.players.map((player) => `${player.hand.length}:${player.played.map((card) => card.id).join(',')}`).join('|'),
  ].join('/')
  return hashText(publicShape)
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other], copy[index]]
  }
  return copy
}

/**
 * 构造一个与当前公开信息相容的世界。
 * 中等仅保留行动 AI 自己的手牌；困难保留所有 AI 手牌。
 * 已在“最后机会”中亮出的玩家视为公开。真人未亮出的手牌和牌库顺序始终重采样。
 */
function sampleHiddenWorld(state: GameState, difficulty: 'medium' | 'hard', rng: () => number): GameState {
  const world = cloneState(state)
  const actor = state.currentPlayer
  const knownIds = new Set<string>()

  for (const pile of state.discards) for (const card of pile) knownIds.add(card.id)
  for (const card of state.drawnChoices) knownIds.add(card.id)
  if (state.pendingDiscard) knownIds.add(state.pendingDiscard.id)
  for (const player of state.players) {
    for (const card of player.played) knownIds.add(card.id)
    const handIsKnown = player.id === actor || state.protectedPlayers.includes(player.id) || (difficulty === 'hard' && !player.isHuman)
    const knownHandIds = handIsKnown ? player.hand.map((card) => card.id) : state.publicKnownHands[player.id]
    for (const id of knownHandIds) knownIds.add(id)
  }

  const unknownPool = shuffled(createDeck().filter((card) => !knownIds.has(card.id)), rng)
  let cursor = 0
  for (const player of world.players) {
    const source = state.players[player.id]
    const handIsKnown = player.id === actor || state.protectedPlayers.includes(player.id) || (difficulty === 'hard' && !player.isHuman)
    if (handIsKnown) player.hand = [...source.hand]
    else {
      const publicIds = new Set(state.publicKnownHands[player.id])
      const fixed = createDeck().filter((card) => publicIds.has(card.id))
      const unknownCount = Math.max(0, source.hand.length - fixed.length)
      player.hand = [...fixed, ...unknownPool.slice(cursor, cursor + unknownCount)]
      cursor += unknownCount
    }
  }
  world.deck = unknownPool.slice(cursor, cursor + state.deck.length)
  return world
}

function legalActions(state: GameState): AiAction[] {
  if (state.phase === 'draw') {
    const actions: AiAction[] = []
    if (state.deck.length >= 2) actions.push({ type: 'draw-deck' })
    state.discards.forEach((pile, index) => {
      if (pile.length) actions.push({ type: 'take-discard', pile: index as 0 | 1 })
    })
    return actions
  }
  if (state.phase === 'choose-drawn') return state.drawnChoices.map((card) => ({ type: 'keep-drawn', cardId: card.id }))
  if (state.phase === 'choose-discard') {
    const emptyPiles = state.discards
      .map((pile, index) => pile.length === 0 ? index as 0 | 1 : null)
      .filter((index): index is 0 | 1 => index !== null)
    return emptyPiles.length === 1
      ? [{ type: 'place-discard', pile: emptyPiles[0] }]
      : [{ type: 'place-discard', pile: 0 }, { type: 'place-discard', pile: 1 }]
  }
  if (state.phase === 'crab-pick') {
    return state.discards.flatMap((pile, pileIndex) => pile.map((card) => ({
      type: 'take-crab' as const,
      pile: pileIndex as 0 | 1,
      cardId: card.id,
    })))
  }
  if (state.phase === 'steal-target') return stealTargets(state).map((targetId) => ({ type: 'steal', targetId }))
  if (state.phase === 'duo') {
    const actions: AiAction[] = playableDuos(state).map((duo) => ({ type: 'play-duo', duo }))
    actions.push({ type: 'continue' })
    if (canCall(state)) actions.push({ type: 'stop' }, { type: 'last-chance' })
    return actions
  }
  return []
}

function applyAction(state: GameState, action: AiAction): void {
  if (action.type === 'draw-deck') drawTwo(state)
  else if (action.type === 'take-discard') takeDiscardTop(state, action.pile)
  else if (action.type === 'keep-drawn') keepDrawnCard(state, action.cardId)
  else if (action.type === 'place-discard') placePendingDiscard(state, action.pile)
  else if (action.type === 'play-duo') playDuo(state, action.duo)
  else if (action.type === 'take-crab') takeCrabCard(state, action.pile, action.cardId)
  else if (action.type === 'steal') stealRandomCard(state, action.targetId)
  else if (action.type === 'continue') endTurn(state)
  else if (action.type === 'stop') callStop(state)
  else callLastChance(state)
}

function actionCard(state: GameState, action: AiAction): Card | undefined {
  if (action.type === 'take-discard') return state.discards[action.pile].at(-1)
  if (action.type === 'keep-drawn') return state.drawnChoices.find((card) => card.id === action.cardId)
  if (action.type === 'take-crab') return state.discards[action.pile].find((card) => card.id === action.cardId)
  return undefined
}

function visibleCards(state: GameState, playerId: number): Card[] {
  const player = state.players[playerId]
  if (state.protectedPlayers.includes(playerId)) return allCards(player)
  const publicIds = new Set(state.publicKnownHands[playerId])
  return [...player.played, ...createDeck().filter((card) => publicIds.has(card.id))]
}

function coalitionLeader(state: GameState): number {
  const candidates = state.players.filter((player) => !player.isHuman)
  return candidates.reduce((best, player) => {
    const cards = allCards(player)
    const value = player.totalScore + scoreCards(cards).total + (scoreCards(cards).total >= 7 ? 1.5 : 0) + countKind(cards, 'mermaid') * 2
    const bestCards = allCards(best)
    const bestValue = best.totalScore + scoreCards(bestCards).total + (scoreCards(bestCards).total >= 7 ? 1.5 : 0) + countKind(bestCards, 'mermaid') * 2
    return value > bestValue ? player : best
  }).id
}

function cardValue(state: GameState, playerId: number, card: Card, difficulty: AiDifficulty): number {
  const owned = allCards(state.players[playerId])
  const before = scoreCards(owned)
  const after = scoreCards([...owned, card])
  const sameKind = countKind(owned, card.kind)
  const sameColor = owned.filter((ownedCard) => ownedCard.color === card.color).length
  const completesPair = ['crab', 'boat', 'fish'].includes(card.kind)
    ? sameKind % 2 === 1
    : card.kind === 'shark'
      ? countKind(owned, 'swimmer') > countKind(owned, 'shark')
      : card.kind === 'swimmer' && countKind(owned, 'shark') > countKind(owned, 'swimmer')
  let value = (after.total - before.total) * 4 + sameKind * 0.32 + sameColor * 0.24 + (completesPair ? 2.6 : 0)
  value += 0.2 / KIND_META[card.kind].count

  const multiplierKinds: Partial<Record<Card['kind'], Card['kind']>> = {
    lighthouse: 'boat', shoal: 'fish', 'penguin-colony': 'penguin', captain: 'sailor',
  }
  const linked = multiplierKinds[card.kind]
  if (linked) value += countKind(owned, linked) * (difficulty === 'easy' ? 0.12 : 0.8)
  if (card.kind === 'boat') value += countKind(owned, 'lighthouse') * 0.8
  if (card.kind === 'fish') value += countKind(owned, 'shoal') * 0.8
  if (card.kind === 'penguin') value += countKind(owned, 'penguin-colony') * 1.3
  if (card.kind === 'sailor') value += countKind(owned, 'captain') * 1.6
  if (card.kind === 'mermaid') value += 2.2 + sameColor * 0.7

  if (difficulty === 'hard') {
    const humanVisible = visibleCards(state, 0)
    if (card.kind === 'mermaid' && countKind(humanVisible, 'mermaid') >= 3) value += 1000
    const humanSameKind = countKind(humanVisible, card.kind)
    value += humanSameKind * 0.55
    if (card.kind === 'boat' && countKind(humanVisible, 'lighthouse')) value += 1.8
    if (card.kind === 'fish' && countKind(humanVisible, 'shoal')) value += 1.8
    if (card.kind === 'penguin' && countKind(humanVisible, 'penguin-colony')) value += 2.2
    if (card.kind === 'sailor' && countKind(humanVisible, 'captain')) value += 2.6
  }
  return value
}

function winProbabilities(state: GameState): number[] {
  if (state.phase === 'game-over') return state.players.map((player) => state.winnerIds.includes(player.id) ? 1 / state.winnerIds.length : 0)
  const target = targetScore(state.players.length)
  const strengths = state.players.map((player) => {
    const round = scoreCards(allCards(player)).total
    return player.totalScore + round * 0.75 + Math.min(8, player.hand.length) * 0.12
  })
  const max = Math.max(...strengths)
  const weights = strengths.map((strength) => Math.exp((strength - max) / Math.max(4, target * 0.13)))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map((weight) => weight / total)
}

function individualUtility(state: GameState, actor: number): number {
  const win = winProbabilities(state)[actor]
  const scores = state.players.map((player) => player.totalScore + scoreCards(allCards(player)).total)
  const bestOther = Math.max(...scores.filter((_, index) => index !== actor))
  const lead = (scores[actor] - bestOther) / targetScore(state.players.length)
  const round = (state.players[actor].lastRoundScore || scoreCards(allCards(state.players[actor])).total) / 20
  return 0.7 * win + 0.2 * lead + 0.1 * round
}

function coalitionUtility(state: GameState): number {
  const probabilities = winProbabilities(state)
  const aiPlayers = state.players.filter((player) => !player.isHuman)
  const coalitionWin = aiPlayers.reduce((sum, player) => sum + probabilities[player.id], 0)
  const human = state.players[0]
  const humanProjected = human.totalScore + scoreCards(allCards(human)).total
  const bestAiProjected = Math.max(...aiPlayers.map((player) => player.totalScore + scoreCards(allCards(player)).total))
  const lead = (bestAiProjected - humanProjected) / targetScore(state.players.length)
  const humanRound = (human.lastRoundScore || scoreCards(allCards(human)).total) / 20
  return 0.75 * coalitionWin + 0.15 * lead - 0.10 * humanRound
}

function actionBias(state: GameState, action: AiAction, actor: number, difficulty: AiDifficulty): number {
  const card = actionCard(state, action)
  if (card) return cardValue(state, actor, card, difficulty) * 0.012
  if (action.type === 'draw-deck') return state.deck.length <= 1 ? -0.2 : 0.012
  if (action.type === 'play-duo') {
    if (action.duo === 'fish' && state.deck.length <= 1) return -0.25
    if (action.duo === 'crab') return 0.05
    if (action.duo === 'shark-swimmer') return difficulty === 'hard' ? 0.08 : 0.055
    if (action.duo === 'boat') return 0.045
    return 0.04
  }
  if (action.type === 'steal') {
    const target = state.players[action.targetId]
    const humanThreat = target.isHuman
      ? target.totalScore + scoreCards(visibleCards(state, target.id)).total >= targetScore(state.players.length) - 4 ? 0.12 : 0
      : 0
    return target.hand.length * 0.006 + (difficulty === 'hard' && target.isHuman ? 0.11 + humanThreat : 0)
  }
  if (action.type === 'place-discard' && difficulty === 'hard' && state.pendingDiscard) {
    const next = (actor + 1) % state.players.length
    if (next === 0) {
      const publicHumanCards = visibleCards(state, 0)
      const gain = scoreCards([...publicHumanCards, state.pendingDiscard]).total - scoreCards(publicHumanCards).total
      return -0.02 * gain
    }
    const feed = cardValue(state, next, state.pendingDiscard, 'medium')
    return feed * (next === coalitionLeader(state) ? 0.009 : 0.004)
  }
  if (action.type === 'last-chance') return 0.015
  return 0
}

function rolloutAction(state: GameState, difficulty: 'medium' | 'hard'): AiAction | undefined {
  const actions = legalActions(state)
  if (!actions.length) return undefined
  const actor = state.currentPlayer
  const actorIsAi = !state.players[actor].isHuman
  let best = actions[0]
  let bestValue = -Infinity
  for (const action of actions) {
    const next = cloneState(state)
    try { applyAction(next, action) } catch { continue }
    const value = difficulty === 'hard' && actorIsAi ? coalitionUtility(next) : individualUtility(next, actor)
    const adjusted = value + actionBias(state, action, actor, difficulty)
    if (adjusted > bestValue) {
      best = action
      bestValue = adjusted
    }
  }
  return best
}

function simulate(state: GameState, difficulty: 'medium' | 'hard', depth: number): GameState {
  let completedTurns = 0
  let guard = 0
  while (!['round-result', 'game-over'].includes(state.phase) && completedTurns < depth && guard < 60) {
    const action = rolloutAction(state, difficulty)
    if (!action) break
    const beforePhase = state.phase
    try { applyAction(state, action) } catch { break }
    if ((beforePhase === 'duo' && action.type === 'continue') || ['round-result', 'game-over'].includes(state.phase)) completedTurns += 1
    guard += 1
  }
  return state
}

function chooseMonteCarloAction(state: GameState, difficulty: 'medium' | 'hard'): AiAction | undefined {
  const actions = legalActions(state)
  if (actions.length <= 1) return actions[0]
  const config = AI_SEARCH_CONFIG[difficulty]
  const totals = actions.map(() => 0)
  const rng = makeRng(decisionSeed(state, difficulty))
  const actor = state.currentPlayer

  for (let sample = 0; sample < config.samples; sample += 1) {
    const world = sampleHiddenWorld(state, difficulty, rng)
    actions.forEach((action, index) => {
      const next = cloneState(world)
      try {
        applyAction(next, action)
        simulate(next, difficulty, config.depth)
        totals[index] += difficulty === 'medium' ? individualUtility(next, actor) : coalitionUtility(next)
        totals[index] += actionBias(world, action, actor, difficulty)
      } catch {
        totals[index] -= 100
      }
    })
  }
  const bestIndex = totals.reduce((best, value, index) => value > totals[best] ? index : best, 0)
  return actions[bestIndex]
}

function isImmediateMermaidWin(state: GameState, action: AiAction): boolean {
  const card = actionCard(state, action)
  return Boolean(card?.kind === 'mermaid' && countKind(allCards(state.players[state.currentPlayer]), 'mermaid') >= 3)
}

function simpleValue(state: GameState, action: AiAction): number {
  const actor = state.currentPlayer
  const card = actionCard(state, action)
  if (card) return cardValue(state, actor, card, 'easy')
  if (action.type === 'draw-deck') return state.deck.length <= 1 ? -50 : 1.35
  if (action.type === 'place-discard') {
    const next = (actor + 1) % state.players.length
    const pending = state.pendingDiscard
    const top = state.discards[action.pile].at(-1)
    let risk = 0
    if (pending && top?.kind === pending.kind) risk += 0.35
    if (next === 0 && pending) risk += visibleCards(state, 0).filter((known) => known.kind === pending.kind).length * 0.18
    return -risk
  }
  if (action.type === 'play-duo') {
    if (action.duo === 'fish' && state.deck.length <= 1) return -100
    return action.duo === 'boat' ? 2.1 : action.duo === 'fish' ? 2 : action.duo === 'crab' ? 1.8 : 1.7
  }
  if (action.type === 'steal') return 1 + state.players[action.targetId].hand.length * 0.08
  if (action.type === 'stop') return 2.4
  if (action.type === 'last-chance') {
    const own = scoreCards(allCards(state.players[actor])).total
    const visibleBest = Math.max(...state.players.filter((player) => player.id !== actor).map((player) => scoreCards(visibleCards(state, player.id)).total))
    return own >= visibleBest + 3 ? 2.55 : 1.1
  }
  return 0
}

function chooseEasyAction(state: GameState): AiAction | undefined {
  let actions = legalActions(state)
  if (actions.length <= 1) return actions[0]
  const immediate = actions.find((action) => isImmediateMermaidWin(state, action))
  if (immediate) return immediate

  if (state.phase === 'steal-target') {
    const rng = makeRng(decisionSeed(state, 'easy'))
    return actions[Math.floor(rng() * actions.length)]
  }

  if (state.phase === 'duo') {
    const player = state.players[state.currentPlayer]
    const projectedTotal = player.totalScore + scoreCards(allCards(player)).total
    const stop = actions.find((action) => action.type === 'stop')
    if (stop && projectedTotal >= targetScore(state.players.length)) return stop
    actions = actions.filter((action) => !(action.type === 'play-duo' && action.duo === 'fish' && state.deck.length <= 1))
  }

  const ranked = [...actions].sort((a, b) => simpleValue(state, b) - simpleValue(state, a))
  const rng = makeRng(decisionSeed(state, 'easy'))
  const roll = rng()
  if (ranked.length === 2) return roll < 0.3 ? ranked[0] : ranked[1]
  if (roll < 0.1) return ranked[0]
  if (roll < 0.8) return ranked[1]
  return ranked[2]
}

/** 执行当前 AI 阶段的一步；界面会在每一步后重新渲染并再次调用。 */
export function runAiStep(state: GameState, difficulty: AiDifficulty = 'medium'): void {
  const player = state.players[state.currentPlayer]
  if (!player || player.isHuman || ['round-result', 'game-over'].includes(state.phase)) return
  const action = difficulty === 'easy' ? chooseEasyAction(state) : chooseMonteCarloAction(state, difficulty)
  if (action) applyAction(state, action)
}

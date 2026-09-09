export type CardKind =
  | 'crab'
  | 'boat'
  | 'fish'
  | 'shark'
  | 'swimmer'
  | 'mermaid'
  | 'shell'
  | 'octopus'
  | 'penguin'
  | 'sailor'
  | 'lighthouse'
  | 'shoal'
  | 'penguin-colony'
  | 'captain'

export type CardColor =
  | 'deep-blue'
  | 'sky-blue'
  | 'ink'
  | 'yellow'
  | 'sea-green'
  | 'white'
  | 'purple'
  | 'mist'
  | 'peach'
  | 'pink'
  | 'orange'

export type AiDifficulty = 'easy' | 'medium' | 'hard'

export interface Card {
  id: string
  kind: CardKind
  color: CardColor
  artCount: 1 | 2
}

export interface PlayerState {
  id: number
  name: string
  isHuman: boolean
  hand: Card[]
  played: Card[]
  totalScore: number
  lastRoundScore: number
}

export type Phase =
  | 'draw'
  | 'choose-drawn'
  | 'choose-discard'
  | 'duo'
  | 'crab-pick'
  | 'steal-target'
  | 'round-result'
  | 'game-over'

export type DuoKind = 'crab' | 'boat' | 'fish' | 'shark-swimmer'

export interface RoundScore {
  playerId: number
  cardPoints: number
  colorBonus: number
  awarded: number
  note: string
}

export interface GameState {
  players: PlayerState[]
  deck: Card[]
  discards: [Card[], Card[]]
  currentPlayer: number
  startingPlayer: number
  roundNumber: number
  phase: Phase
  drawnChoices: Card[]
  pendingDiscard: Card | null
  extraTurns: number
  lastChanceCaller: number | null
  lastChanceQueue: number[] | null
  protectedPlayers: number[]
  /** 所有人都确切知道仍在对应玩家手中的明牌 ID。 */
  publicKnownHands: string[][]
  roundEndedBy: number | null
  roundScores: RoundScore[]
  winnerIds: number[]
  message: string
  seed: number
}

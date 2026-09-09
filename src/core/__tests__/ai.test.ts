import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { AI_SEARCH_CONFIG, runAiStep } from '../ai'
import { createGame } from '../engine'
import type { AiDifficulty } from '../types'

describe('三档 AI', () => {
  it('中等与困难使用约定范围内的采样数和搜索深度', () => {
    expect(AI_SEARCH_CONFIG.medium.samples).toBeGreaterThanOrEqual(300)
    expect(AI_SEARCH_CONFIG.medium.samples).toBeLessThanOrEqual(800)
    expect(AI_SEARCH_CONFIG.hard.samples).toBeGreaterThanOrEqual(300)
    expect(AI_SEARCH_CONFIG.hard.samples).toBeLessThanOrEqual(800)
    expect(AI_SEARCH_CONFIG.medium.depth).toBeGreaterThanOrEqual(3)
    expect(AI_SEARCH_CONFIG.medium.depth).toBeLessThanOrEqual(5)
    expect(AI_SEARCH_CONFIG.hard.depth).toBeGreaterThanOrEqual(3)
    expect(AI_SEARCH_CONFIG.hard.depth).toBeLessThanOrEqual(5)
  })

  it.each(['easy', 'medium', 'hard'] as AiDifficulty[])('%s 能在抽牌阶段完成一个合法决策', (difficulty) => {
    const state = createGame(3, 20260907)
    state.currentPlayer = 1
    state.phase = 'draw'
    const before = state.deck.length + state.discards[0].length + state.discards[1].length
    runAiStep(state, difficulty)
    const after = state.deck.length + state.discards[0].length + state.discards[1].length + state.players[1].hand.length + state.drawnChoices.length
    expect(state.phase).not.toBe('draw')
    expect(after).toBe(before)
  }, 30_000)

  it('可处理页面实际传入的 Vue 响应式状态', () => {
    const state = reactive(createGame(3, 77))
    state.currentPlayer = 1
    runAiStep(state, 'medium')
    expect(state.phase).not.toBe('draw')
  }, 30_000)
})

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GameCard from './components/GameCard.vue'
import OrigamiArt from './components/OrigamiArt.vue'
import { COLOR_META, KIND_META, countDeckColors, createDeck } from './core/cards'
import { runAiStep } from './core/ai'
import {
  allCards,
  callLastChance,
  callStop,
  canCall,
  createGame,
  drawTwo,
  endTurn,
  keepDrawnCard,
  nextRound,
  placePendingDiscard,
  playableDuos,
  playDuo,
  stealRandomCard,
  stealTargets,
  takeCrabCard,
  takeDiscardTop,
} from './core/engine'
import { scoreCards } from './core/scoring'
import type { AiDifficulty, Card, DuoKind, GameState } from './core/types'
import { playSound, setSoundEnabled, soundEnabled, unlockAudio } from './audio/player'

type Screen = 'home' | 'game'
const screen = ref<Screen>('home')
const game = ref<GameState | null>(null)
const playerCount = ref(3)
const difficulty = ref<AiDifficulty>('medium')
const showRules = ref(false)
const showSettings = ref(false)
const sound = ref(soundEnabled())
const thinking = ref(false)
const toast = ref('')
const choosingDuo = ref<DuoKind | null>(null)
const chosenDuoCards = ref<string[]>([])
const ruleDeck = createDeck()
const ruleColorCounts = countDeckColors(ruleDeck)
let aiTimer: number | undefined
let toastTimer: number | undefined

const currentPlayer = computed(() => game.value?.players[game.value.currentPlayer] ?? null)
const humanTurn = computed(() => Boolean(currentPlayer.value?.isHuman))
const human = computed(() => game.value?.players[0] ?? null)
const humanBreakdown = computed(() => human.value ? scoreCards(allCards(human.value)) : null)
const availableDuos = computed(() => game.value && humanTurn.value ? playableDuos(game.value) : [])
const eligibleTargets = computed(() => game.value ? stealTargets(game.value) : [])
const duoSelectableCards = computed(() => {
  if (!game.value || !choosingDuo.value) return []
  const hand = game.value.players[game.value.currentPlayer].hand
  if (choosingDuo.value === 'shark-swimmer') return hand.filter((card) => card.kind === 'shark' || card.kind === 'swimmer')
  return hand.filter((card) => card.kind === choosingDuo.value)
})
const duoSelectionReady = computed(() => {
  if (!game.value || !choosingDuo.value || chosenDuoCards.value.length !== 2) return false
  const chosen = duoSelectableCards.value.filter((card) => chosenDuoCards.value.includes(card.id))
  if (choosingDuo.value === 'shark-swimmer') return chosen.some((card) => card.kind === 'shark') && chosen.some((card) => card.kind === 'swimmer')
  return chosen.length === 2
})

const duoLabels: Record<DuoKind, string> = {
  crab: '发动双蟹',
  boat: '发动双船',
  fish: '发动双鱼',
  'shark-swimmer': '鲨鱼＋泳者',
}

const difficultyMeta: Record<AiDifficulty, { name: string; short: string; description: string }> = {
  easy: { name: '简单', short: '有限信息 · 次优行动', description: '只看自己的牌和桌面，通常选择第二优行动。' },
  medium: { name: '中等', short: '公平记忆 · 各自争胜', description: '记忆公开信息并推演可能局面，每名 AI 都只为自己获胜。' },
  hard: { name: '困难', short: '共享手牌内容 · AI 联盟', description: 'AI 之间知道彼此手牌的内容并合作压制真人，但不会交换卡牌，也看不到你的手牌和牌库顺序。' },
}

function ruleCard(kind: Card['kind']): Card | undefined {
  return ruleDeck.find((card) => card.kind === kind)
}

function start(): void {
  unlockAudio()
  playSound('play')
  cancelDuoSelection()
  game.value = createGame(playerCount.value)
  screen.value = 'game'
}

function notify(message: string): void {
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 2200)
}

function act(action: () => void, soundName: 'select' | 'play' = 'select'): void {
  try {
    unlockAudio()
    action()
    playSound(soundName)
  } catch (error) {
    notify(error instanceof Error ? error.message : '操作失败')
  }
}

function clickDeck(): void {
  if (!game.value || !humanTurn.value || game.value.phase !== 'draw' || game.value.deck.length < 2) return
  act(() => drawTwo(game.value!))
}

function discardActionable(pile: 0 | 1): boolean {
  if (!game.value || !humanTurn.value) return false
  if (game.value.phase === 'draw') return game.value.discards[pile].length > 0
  if (game.value.phase !== 'choose-discard') return false
  const emptyPiles = game.value.discards
    .map((cards, index) => cards.length === 0 ? index : -1)
    .filter((index) => index >= 0)
  return emptyPiles.length !== 1 || emptyPiles[0] === pile
}

function clickDiscard(pile: 0 | 1): void {
  if (!game.value || !humanTurn.value) return
  if (game.value.phase === 'draw') act(() => takeDiscardTop(game.value!, pile))
  else if (game.value.phase === 'choose-discard') act(() => placePendingDiscard(game.value!, pile), 'play')
}

function chooseDrawn(card: Card): void {
  if (!game.value) return
  act(() => keepDrawnCard(game.value!, card.id))
}

function useDuo(duo: DuoKind): void {
  choosingDuo.value = duo
  chosenDuoCards.value = []
}

function toggleDuoCard(card: Card): void {
  const selected = chosenDuoCards.value
  if (selected.includes(card.id)) {
    chosenDuoCards.value = selected.filter((id) => id !== card.id)
    return
  }
  if (choosingDuo.value === 'shark-swimmer') {
    const sameKindIds = duoSelectableCards.value.filter((item) => item.kind === card.kind).map((item) => item.id)
    chosenDuoCards.value = selected.filter((id) => !sameKindIds.includes(id)).concat(card.id)
  } else if (selected.length < 2) {
    chosenDuoCards.value = [...selected, card.id]
  }
}

function confirmDuo(): void {
  if (!game.value || !choosingDuo.value || !duoSelectionReady.value) return
  const duo = choosingDuo.value
  const cardIds = [...chosenDuoCards.value]
  choosingDuo.value = null
  chosenDuoCards.value = []
  act(() => playDuo(game.value!, duo, cardIds), 'play')
}

function cancelDuoSelection(): void {
  choosingDuo.value = null
  chosenDuoCards.value = []
}

function takeFromCrab(pile: number, card: Card): void {
  if (!game.value) return
  act(() => takeCrabCard(game.value!, pile as 0 | 1, card.id), 'play')
}

function chooseStealTarget(id: number): void {
  if (!game.value) return
  act(() => stealRandomCard(game.value!, id), 'play')
}

function continueTurn(): void {
  if (!game.value) return
  act(() => endTurn(game.value!))
}

function declareStop(): void {
  if (!game.value) return
  act(() => callStop(game.value!), 'play')
}

function declareLastChance(): void {
  if (!game.value) return
  act(() => callLastChance(game.value!), 'play')
}

function toggleSound(): void {
  sound.value = !sound.value
  setSoundEnabled(sound.value)
}

function returnHome(): void {
  window.clearTimeout(aiTimer)
  cancelDuoSelection()
  game.value = null
  screen.value = 'home'
  showSettings.value = false
}

function phaseKey(state: GameState | null): string {
  if (!state) return 'none'
  return [state.currentPlayer, state.phase, state.deck.length, state.players.map((p) => `${p.hand.length}.${p.played.length}`).join('-'), state.discards.map((p) => p.length).join('-')].join('|')
}

watch(() => phaseKey(game.value), () => {
  window.clearTimeout(aiTimer)
  if (!game.value || game.value.players[game.value.currentPlayer]?.isHuman || ['round-result', 'game-over'].includes(game.value.phase)) {
    thinking.value = false
    return
  }
  thinking.value = true
  aiTimer = window.setTimeout(() => {
    if (!game.value) return
    try { runAiStep(game.value, difficulty.value) }
    catch (error) { notify(error instanceof Error ? error.message : 'AI行动失败') }
    thinking.value = false
  }, 180)
}, { immediate: true })

onMounted(() => window.addEventListener('pointerdown', unlockAudio, { once: true }))
onBeforeUnmount(() => {
  window.clearTimeout(aiTimer)
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <main class="app-shell" :class="`screen-${screen}`">
    <div class="ambient ambient-one" />
    <div class="ambient ambient-two" />

    <template v-if="screen === 'home'">
      <section class="home-panel">
        <div class="brand-stamp">非官方网页改编</div>
        <div class="cover-collection" aria-hidden="true">
          <span class="cover-sun" />
          <span class="cover-wave wave-back" />
          <span class="cover-wave wave-front" />
          <span class="cover-piece cover-fish"><OrigamiArt kind="fish" :count="2" /></span>
          <span class="cover-piece cover-boat"><OrigamiArt kind="boat" :count="1" /></span>
          <span class="cover-piece cover-crab"><OrigamiArt kind="crab" :count="1" /></span>
          <span class="cover-piece cover-shell"><OrigamiArt kind="shell" :count="1" /></span>
        </div>
        <h1>SEA SALT<br><span>&amp; PAPER</span></h1>
        <p class="subtitle">每回合先拿一张牌，再用成对卡牌发动效果。牌分达到7分后，选择立即结算，或让对手各再行动一次，赌自己仍是最高分。</p>
        <div class="quick-summary" aria-label="玩法概要">
          <span><b>1</b>拿牌</span><i>→</i><span><b>2</b>凑对并发动</span><i>→</i><span><b>3</b>7分后收手或冒险</span>
        </div>

        <div class="setup-card">
          <div>
            <span class="setup-label">参与人数</span>
            <strong>你与 {{ playerCount - 1 }} 名 AI</strong>
          </div>
          <div class="segmented" role="group" aria-label="选择玩家人数">
            <button v-for="count in [2,3,4]" :key="count" :class="{ active: playerCount === count }" @click="playerCount = count; playSound('select')">{{ count }}人</button>
          </div>
        </div>

        <div class="setup-card difficulty-card">
          <div class="difficulty-copy">
            <span class="setup-label">AI 难度</span>
            <strong>{{ difficultyMeta[difficulty].short }}</strong>
            <small>{{ difficultyMeta[difficulty].description }}</small>
          </div>
          <div class="segmented" role="group" aria-label="选择AI难度">
            <button v-for="level in (['easy','medium','hard'] as AiDifficulty[])" :key="level" :class="{ active: difficulty === level }" @click="difficulty = level; playSound('select')">{{ difficultyMeta[level].name }}</button>
          </div>
        </div>

        <button class="primary large" @click="start">开始航行</button>
        <div class="home-links">
          <button @click="showRules = true">玩法速览</button>
          <button @click="showSettings = true">声音设置</button>
        </div>
        <p class="fan-note">非官方、非商业的网页改编；卡面使用重新绘制的几何折纸图形。</p>
      </section>
    </template>

    <template v-else-if="game">
      <header class="topbar">
        <button class="brand-mini" @click="returnHome"><span>SEA SALT</span>&amp; PAPER</button>
        <div class="round-pill">第 {{ game.roundNumber }} 轮 · {{ difficultyMeta[difficulty].name }} AI · 牌库 {{ game.deck.length }}</div>
        <nav>
          <button class="icon-button" @click="showRules = true" aria-label="规则">?</button>
          <button class="icon-button" @click="showSettings = true" aria-label="设置">⚙</button>
        </nav>
      </header>

      <section class="opponents">
        <article
          v-for="player in game.players.slice(1)"
          :key="player.id"
          class="opponent"
          :class="{ active: game.currentPlayer === player.id, revealed: game.protectedPlayers.includes(player.id) }"
        >
          <div class="avatar">{{ player.name.slice(0,1) }}</div>
          <div class="opponent-copy">
            <strong>{{ player.name }}</strong>
            <span>{{ game.protectedPlayers.includes(player.id) ? `手牌已公开 · ${player.hand.length} 张` : `${player.hand.length} 张手牌 · 已打出 ${player.played.length}` }}</span>
          </div>
          <div class="score-orb">{{ player.totalScore }}</div>
          <div v-if="player.played.length" class="opponent-card-zone" aria-label="对手已经打出的牌">
            <span class="opponent-card-label">已打出 · {{ player.played.length }}</span>
            <div class="opponent-card-row">
              <GameCard v-for="card in player.played" :key="card.id" :card="card" compact disabled />
            </div>
          </div>
          <div v-if="game.protectedPlayers.includes(player.id) && player.hand.length" class="opponent-card-zone revealed-zone" aria-label="最后机会中已公开的手牌">
            <span class="opponent-card-label">最后机会 · 手牌已公开</span>
            <div class="opponent-card-row">
              <GameCard v-for="card in player.hand" :key="card.id" :card="card" compact disabled />
            </div>
          </div>
        </article>
      </section>

      <section class="table-area">
        <div class="turn-banner" :class="{ thinking }">
          <span class="turn-dot" />
          <strong>{{ thinking ? `${currentPlayer?.name}正在观察潮汐…` : game.message }}</strong>
        </div>

        <div class="center-piles">
          <div class="pile-wrap discard" :class="{ actionable: discardActionable(0) }" role="button" tabindex="0" @click="clickDiscard(0)" @keydown.enter="clickDiscard(0)">
            <span class="pile-label">弃牌堆 A · {{ game.discards[0].length }}</span>
            <GameCard :card="game.discards[0][game.discards[0].length - 1]" :hidden="!game.discards[0].length" disabled />
          </div>
          <div class="pile-wrap deck" :class="{ actionable: humanTurn && game.phase === 'draw' && game.deck.length >= 2 }" role="button" tabindex="0" @click="clickDeck" @keydown.enter="clickDeck">
            <span class="pile-label">{{ game.deck.length >= 2 ? '牌库 · 抽两张' : '牌库 · 不足两张' }}</span>
            <GameCard hidden disabled />
            <span class="deck-depth">{{ game.deck.length }}</span>
          </div>
          <div class="pile-wrap discard" :class="{ actionable: discardActionable(1) }" role="button" tabindex="0" @click="clickDiscard(1)" @keydown.enter="clickDiscard(1)">
            <span class="pile-label">弃牌堆 B · {{ game.discards[1].length }}</span>
            <GameCard :card="game.discards[1][game.discards[1].length - 1]" :hidden="!game.discards[1].length" disabled />
          </div>
        </div>

        <div v-if="human?.played.length" class="played-zone">
          <div class="section-title"><span>你的公开组合</span><small>{{ human.played.length }} 张，仍计入颜色与牌分</small></div>
          <div class="played-row"><GameCard v-for="card in human.played" :key="card.id" :card="card" compact disabled /></div>
        </div>
      </section>

      <section class="player-dock">
        <div class="dock-head">
          <div>
            <span class="you-label">你的海域</span>
            <strong>{{ human?.hand.length }} 张手牌</strong>
          </div>
          <div class="score-breakdown" v-if="humanBreakdown">
            <span>对子 {{ humanBreakdown.duo }}</span>
            <span>收藏 {{ humanBreakdown.collector }}</span>
            <span>加成 {{ humanBreakdown.multiplier }}</span>
            <span>人鱼 {{ humanBreakdown.mermaid }}</span>
            <strong>{{ humanBreakdown.total }} 分</strong>
          </div>
        </div>

        <div class="hand-scroll">
          <div v-if="!human?.hand.length" class="empty-hand">抽牌后，折纸会在这里展开</div>
          <GameCard v-for="card in human?.hand" :key="card.id" :card="card" disabled />
        </div>

        <div class="action-bar" v-if="humanTurn && game.phase === 'duo'">
          <div class="duo-actions">
            <button v-for="duo in availableDuos" :key="duo" class="secondary" @click="useDuo(duo)">{{ duoLabels[duo] }}</button>
          </div>
          <div class="turn-actions">
            <button class="ghost" @click="continueTurn">结束回合</button>
            <template v-if="canCall(game)">
              <button class="stop-button" @click="declareStop">STOP<br><small>立即全员计牌分</small></button>
              <button class="chance-button" @click="declareLastChance">最后机会<br><small>让对手各再走一回合</small></button>
            </template>
          </div>
        </div>
      </section>

      <div v-if="humanTurn && game.phase === 'duo' && choosingDuo" class="modal-backdrop">
        <section class="choice-panel duo-picker">
          <p class="eyebrow">{{ duoLabels[choosingDuo] }}</p>
          <h2>选择要公开打出的两张牌</h2>
          <p class="choice-help">牌的颜色仍参与计分；打出后会留在你面前，不能再被偷走。</p>
          <div class="choice-cards scrollable-cards">
            <GameCard
              v-for="card in duoSelectableCards"
              :key="card.id"
              :card="card"
              :selected="chosenDuoCards.includes(card.id)"
              @click="toggleDuoCard(card)"
            />
          </div>
          <div class="dialog-actions">
            <button class="ghost" @click="cancelDuoSelection">取消</button>
            <button class="primary" :disabled="!duoSelectionReady" @click="confirmDuo">打出并发动</button>
          </div>
        </section>
      </div>

      <div v-if="humanTurn && game.phase === 'choose-drawn'" class="modal-backdrop">
        <section class="choice-panel">
          <p class="eyebrow">抽两张 · 留一张</p>
          <h2>哪一张进入你的海域？</h2>
          <div class="choice-cards">
            <GameCard v-for="card in game.drawnChoices" :key="card.id" :card="card" @click="chooseDrawn(card)" />
          </div>
          <p>另一张将在下一步放入你选择的弃牌堆。</p>
        </section>
      </div>

      <div v-if="humanTurn && game.phase === 'choose-discard' && game.pendingDiscard" class="floating-instruction">
        <GameCard :card="game.pendingDiscard" compact disabled />
        <div><strong>这张牌要放到哪里？</strong><span>点击上方弃牌堆 A 或 B</span></div>
      </div>

      <div v-if="humanTurn && game.phase === 'crab-pick'" class="modal-backdrop">
        <section class="choice-panel wide-panel">
          <p class="eyebrow">双蟹 · 翻找旧浪</p>
          <h2>从一个弃牌堆拿任意一张</h2>
          <div class="discard-browser">
            <div v-for="(pile, pileIndex) in game.discards" :key="pileIndex">
              <strong>弃牌堆 {{ pileIndex === 0 ? 'A' : 'B' }}</strong>
              <div class="browser-row">
                <GameCard v-for="card in [...pile].reverse()" :key="card.id" :card="card" compact @click="takeFromCrab(pileIndex, card)" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-if="humanTurn && game.phase === 'steal-target'" class="modal-backdrop">
        <section class="choice-panel small-panel">
          <p class="eyebrow">鲨鱼＋游泳者</p>
          <h2>从谁的手中随机取一张？</h2>
          <button v-for="id in eligibleTargets" :key="id" class="target-button" @click="chooseStealTarget(id)">
            <span>{{ game.players[id].name }}</span><strong>{{ game.players[id].hand.length }} 张手牌</strong>
          </button>
        </section>
      </div>

      <div v-if="game.phase === 'round-result'" class="modal-backdrop">
        <section class="result-panel">
          <p class="eyebrow">ROUND {{ game.roundNumber }}</p>
          <h2>潮水暂歇</h2>
          <div class="result-list">
            <article v-for="result in game.roundScores" :key="result.playerId">
              <div><strong>{{ game.players[result.playerId].name }}</strong><small>{{ result.note }}</small></div>
              <span>牌面 {{ result.cardPoints }}</span>
              <span>颜色 {{ result.colorBonus }}</span>
              <b>+{{ result.awarded }}</b>
              <div class="result-cards" :aria-label="`${game.players[result.playerId].name}本轮公开的全部卡牌`">
                <GameCard v-for="card in allCards(game.players[result.playerId])" :key="card.id" :card="card" compact disabled />
              </div>
            </article>
          </div>
          <button class="primary" @click="act(() => nextRound(game!), 'play')">开始下一轮</button>
        </section>
      </div>

      <div v-if="game.phase === 'game-over'" class="modal-backdrop">
        <section class="result-panel game-over">
          <div class="winner-wave">〰</div>
          <p class="eyebrow">VOYAGE COMPLETE</p>
          <h2>{{ game.message }}</h2>
          <div class="result-list">
            <article v-for="player in [...game.players].sort((a,b) => b.totalScore-a.totalScore)" :key="player.id">
              <strong>{{ player.name }}</strong><span>本轮 +{{ player.lastRoundScore }}</span><b>{{ player.totalScore }} 分</b>
            </article>
          </div>
          <div class="result-actions"><button class="ghost" @click="returnHome">返回首页</button><button class="primary" @click="start">再来一局</button></div>
        </section>
      </div>
    </template>

    <div v-if="showRules" class="drawer-backdrop" @click.self="showRules = false">
      <aside class="drawer rules-drawer">
        <button class="drawer-close" @click="showRules = false">×</button>
        <p class="eyebrow">官方基础版规则 · 中文整理</p>
        <h2>SEA SALT &amp; PAPER</h2>
        <div class="rule-intro">
          <strong>一回合：拿牌 → 可发动 Duo → 可结束本轮</strong>
          <span>手牌与桌前牌的牌面分合计达到 7 分后，可选 STOP 或“最后机会”。游戏进行多轮，先达到目标分数后比较总分。</span>
        </div>

        <section class="rules-section">
          <div class="rules-heading"><span>01</span><div><h3>游戏准备</h3><p>所有玩家从零张手牌开始。</p></div></div>
          <div class="setup-illustration">
            <div class="rule-pile"><GameCard :card="ruleCard('fish')" compact disabled /><small>弃牌堆 A</small></div>
            <div class="rule-pile main"><GameCard hidden compact disabled /><b>56</b><small>牌库</small></div>
            <div class="rule-pile"><GameCard :card="ruleCard('boat')" compact disabled /><small>弃牌堆 B</small></div>
          </div>
          <p class="rule-body">洗匀58张游戏牌并面朝下形成牌库。翻开最上方两张牌，分别放在牌库两侧，形成两个独立的弃牌堆。随机决定首位玩家。</p>
        </section>

        <section class="rules-section">
          <div class="rules-heading"><span>02</span><div><h3>你的回合</h3><p>依次执行以下三个步骤。</p></div></div>
          <div class="turn-flow">
            <article>
              <i>1</i><strong>必须拿一张牌</strong>
              <div class="flow-cards"><GameCard hidden compact disabled /><span>抽2<br>留1</span><GameCard :card="ruleCard('crab')" compact disabled /></div>
              <p>选择一个弃牌堆，只拿最上面一张，不能翻看下方；或者从牌库顶抽两张，留一张入手，把另一张正面朝上放到任一弃牌堆。若有弃牌堆为空，必须将牌放入空堆。</p>
            </article>
            <article>
              <i>2</i><strong>可以发动Duo</strong>
              <div class="flow-cards pair"><GameCard :card="ruleCard('fish')" compact disabled /><b>＋</b><GameCard :card="ruleDeck.filter(card => card.kind === 'fish')[1]" compact disabled /></div>
              <p>将符合条件的两张Duo牌从手牌正面朝上放到自己面前，然后立即执行效果。一个回合可以发动多个Duo；也可以选择不发动。</p>
            </article>
            <article>
              <i>3</i><strong>可以结束本轮</strong>
              <div class="seven-mark">牌面分达到 <b>7+</b></div>
              <p>计算手牌和已打出牌的牌面分。如果达到7分或以上，可以宣布 STOP 或“最后机会”；否则将回合交给左侧玩家。</p>
            </article>
          </div>
          <p class="rules-note"><b>重要：</b>规则中“计算牌分”或“获得牌分”，始终包括手牌与放在自己面前的牌。</p>
        </section>

        <section class="rules-section">
          <div class="rules-heading"><span>03</span><div><h3>怎样结束一轮</h3><p>稳妥收手，或进行一次有代价的押注。</p></div></div>
          <div class="call-comparison">
            <article class="stop-rule">
              <div class="call-title">STOP</div>
              <p>发起者亮出手牌，所有玩家随即亮出手牌。本轮立即结束，每名玩家获得自己的牌面分；不计算额外颜色奖励。</p>
            </article>
            <article class="chance-rule">
              <div class="call-title">最后机会</div>
              <p>发起者先亮出手牌。其他玩家按顺序各进行最后一个回合：拿牌、发动Duo，然后亮出手牌。已经亮出的手牌不再能被攻击。</p>
            </article>
          </div>
          <div class="bet-result">
            <article><b>押注成功</b><p>发起者的牌面分高于或等于每一名对手：发起者获得牌面分＋颜色奖励；其他玩家只获得各自的颜色奖励。</p></article>
            <article><b>押注失败</b><p>至少一名对手的牌面分高于发起者：发起者只获得颜色奖励；其他玩家获得各自的牌面分。</p></article>
          </div>
          <p class="rules-note">颜色奖励＝自己拥有数量最多的那一种颜色的卡牌数量。</p>
        </section>

        <section class="rules-section">
          <div class="rules-heading"><span>04</span><div><h3>Duo牌</h3><p>持有组合即可计1分，只有打出时才执行效果。</p></div></div>
          <div class="illustrated-rule-grid">
            <article><div><GameCard :card="ruleCard('crab')" compact disabled /><GameCard :card="ruleDeck.filter(card => card.kind === 'crab')[1]" compact disabled /></div><strong>两张螃蟹</strong><p>选择一个弃牌堆，在不打乱顺序的情况下查看它，并从中拿任意一张牌入手。无需向对手展示。</p></article>
            <article><div><GameCard :card="ruleCard('boat')" compact disabled /><GameCard :card="ruleDeck.filter(card => card.kind === 'boat')[1]" compact disabled /></div><strong>两张船</strong><p>立即获得另一个完整回合。</p></article>
            <article><div><GameCard :card="ruleCard('fish')" compact disabled /><GameCard :card="ruleDeck.filter(card => card.kind === 'fish')[1]" compact disabled /></div><strong>两张鱼</strong><p>把牌库最上方一张牌加入手牌。</p></article>
            <article><div><GameCard :card="ruleCard('shark')" compact disabled /><GameCard :card="ruleCard('swimmer')" compact disabled /></div><strong>鲨鱼＋游泳者</strong><p>从一名对手手中随机取得一张牌。</p></article>
          </div>
        </section>

        <section class="rules-section">
          <div class="rules-heading"><span>05</span><div><h3>读懂一张牌</h3><p>从上到下看：牌名、功能或累计分值、主体图案、类别与颜色。</p></div></div>
          <div class="card-anatomy">
            <div class="anatomy-cards">
              <div><GameCard :card="ruleCard('shell')" disabled /><small>收藏牌示例</small></div>
              <div><GameCard :card="ruleCard('boat')" disabled /><small>Duo牌示例</small></div>
            </div>
            <div class="anatomy-list">
              <article><b>① 左上牌名</b><p>识别牌型；同类牌可以收藏，特定牌型可以组成 Duo。</p></article>
              <article><b>② 右上信息</b><p>Duo、美人鱼和加成牌显示当前效果；贝壳、章鱼、企鹅、水手显示完整累计分值序列。</p></article>
              <article><b>③ 中央折纸主体</b><p>用于识别和营造主题氛围。图案中主体的数量不改变牌型、效果或计分。</p></article>
              <article><b>④ 底部类别与牌色</b><p>左侧标签说明牌的类别；右侧颜色会计入颜色奖励，也可被美人鱼选择计分。</p></article>
            </div>
          </div>
          <p class="rules-note"><b>Duo 的分数与效果分开：</b>完整组合即使留在手里也计 1 分；只有把两张牌公开打到桌前，才会执行效果。</p>
          <p class="rules-note">手里有三张以上同类 Duo 牌时，可以自行选择具体哪两张公开打出，其余牌继续留在手中。</p>
        </section>

        <section class="rules-section">
          <div class="rules-heading"><span>06</span><div><h3>其他牌与计分</h3><p>同类越多，通常收益越高。</p></div></div>
          <div class="score-groups">
            <article><GameCard :card="ruleCard('mermaid')" compact disabled /><div><strong>美人鱼</strong><p>每张美人鱼选择一种尚未被其他美人鱼计算的颜色，获得该颜色的卡牌数量。美人鱼自身视为白色。集齐四张立即赢得整场游戏。</p></div></article>
            <article><GameCard :card="ruleCard('shell')" compact disabled /><div><strong>贝壳</strong><p>1～6张分别为：0／2／4／6／8／10分。</p></div></article>
            <article><GameCard :card="ruleCard('octopus')" compact disabled /><div><strong>章鱼</strong><p>1～5张分别为：0／3／6／9／12分。</p></div></article>
            <article><GameCard :card="ruleCard('penguin')" compact disabled /><div><strong>企鹅</strong><p>1～3张分别为：1／3／5分。</p></div></article>
            <article><GameCard :card="ruleCard('sailor')" compact disabled /><div><strong>水手</strong><p>1～2张分别为：0／5分。</p></div></article>
          </div>
          <div class="multiplier-list">
            <span><b>灯塔</b> 每张船＋1分</span><span><b>鱼群</b> 每张鱼＋1分</span><span><b>企鹅群落</b> 每张企鹅＋2分</span><span><b>船长</b> 每张水手＋3分</span>
          </div>
          <p class="rules-note">加成牌自身不视为船、鱼、企鹅或水手。</p>
        </section>

        <section class="rules-section">
          <div class="rules-heading"><span>07</span><div><h3>特殊结束与整场胜利</h3><p>先检查特殊胜利，再检查累计分数。</p></div></div>
          <div class="endgame-grid">
            <article><b>牌库耗尽</b><p>若一个玩家回合结束时牌库为空，本轮立即结束，所有人本轮均不得分。</p></article>
            <article><b>下一轮</b><p>若无人达到胜利条件，重新洗匀全部牌。由结束上一轮玩家左侧的人担任新一轮首位玩家。</p></article>
            <article><b>胜利分数</b><p>2人40分 · 3人35分 · 4人30分。有人达到或超过目标后，总分最高者获胜。</p></article>
            <article><b>平分</b><p>总分并列时，并列玩家中上一轮得分更高者获胜。</p></article>
          </div>
        </section>

        <section class="rules-section color-section">
          <div class="rules-heading"><span>08</span><div><h3>颜色构成</h3><p>颜色同时由文字和色块表示。</p></div></div>
        <div class="color-legend">
          <span v-for="(meta, color) in COLOR_META" :key="color" :style="{ '--swatch': meta.a }"><i />{{ meta.name }} ×{{ ruleColorCounts[color] }}</span>
        </div>
        </section>
        <p class="rules-source">根据 Bombyx 发布的《SEA SALT &amp; PAPER》英文基础版规则书整理，不包含扩展规则。<a href="https://studiobombyx.com/assets/SSAP_rulebook_EN-3.pdf" target="_blank" rel="noreferrer">查看官方英文规则书</a></p>
      </aside>
    </div>

    <div v-if="showSettings" class="drawer-backdrop" @click.self="showSettings = false">
      <aside class="drawer settings-drawer">
        <button class="drawer-close" @click="showSettings = false">×</button>
        <p class="eyebrow">设置</p>
        <h2>让海面更舒服</h2>
        <button class="setting-row" @click="toggleSound">
          <div><strong>轻量音效</strong><span>选牌轻点与成功出牌声</span></div>
          <span class="toggle" :class="{ on: sound }"><i /></span>
        </button>
        <button v-if="screen === 'game'" class="danger-link" @click="returnHome">结束本局并返回首页</button>
      </aside>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </main>
</template>

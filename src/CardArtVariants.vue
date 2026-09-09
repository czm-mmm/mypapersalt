<script setup lang="ts">
import { onMounted } from 'vue'
import GameCard from './components/GameCard.vue'
import { createDeck, KIND_META } from './core/cards'
import type { CardKind } from './core/types'

const kinds: CardKind[] = [
  'crab', 'shark', 'swimmer', 'mermaid', 'shell', 'octopus',
  'penguin', 'sailor', 'lighthouse', 'shoal', 'penguin-colony', 'captain',
]
const deck = createDeck()
const variants = [1, 2, 3] as const
const labels = {
  1: ['A', '正面结构'],
  2: ['B', '动态场景'],
  3: ['C', '几何抽象'],
} as const
const exportMode = new URLSearchParams(window.location.search).has('export')

function cardFor(kind: CardKind) {
  return deck.find((card) => card.kind === kind)!
}

onMounted(async () => {
  await document.fonts.ready
  document.documentElement.dataset.exportReady = 'true'
})
</script>

<template>
  <main class="variant-page" :class="{ 'export-mode': exportMode }">
    <header v-if="!exportMode" class="variant-header">
      <p>ART DIRECTION · 背景色保持不变</p>
      <h1>主题图案三案对比</h1>
      <span>不含“船”和“鱼”；每组依次分别为 A 正面结构、B 动态场景、C 几何抽象。</span>
    </header>
    <div class="variant-sheet">
      <section v-for="kind in kinds" :key="kind" class="kind-group" :data-kind="kind">
        <div class="kind-heading"><strong>{{ KIND_META[kind].name }}</strong><small>{{ kind }}</small></div>
        <div class="variant-row">
          <figure v-for="variant in variants" :key="variant" class="variant-card" :data-file="`${kind}_${labels[variant][0]}.png`">
            <GameCard :card="cardFor(kind)" :concept-variant="variant" disabled />
            <figcaption><b>{{ labels[variant][0] }}</b><span>{{ labels[variant][1] }}</span></figcaption>
          </figure>
        </div>
      </section>
    </div>
  </main>
</template>

<style>
* { box-sizing:border-box; }
html,body,#variants-app { min-height:100%; margin:0; }
body { background:#dce8e3; font-family:"Noto Sans SC","Microsoft YaHei",sans-serif; }
.variant-page { width:1600px; min-height:100vh; padding:42px; color:#244f59; background:linear-gradient(145deg,#edf3ef,#d9e7e1); }
.variant-header { margin-bottom:30px; padding:0 7px; }
.variant-header p { margin:0 0 6px; color:#6f8789; font-size:12px; font-weight:800; letter-spacing:.18em; }
.variant-header h1 { margin:0 0 8px; color:#174f5e; font-family:"Playfair Display","Noto Serif SC",serif; font-size:38px; }
.variant-header span { color:#71878a; font-size:13px; }
.variant-sheet { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
.kind-group { min-width:0; padding:16px; border:1px solid rgba(28,80,89,.1); border-radius:20px; background:rgba(255,255,255,.68); box-shadow:0 12px 30px rgba(30,74,78,.08); }
.kind-heading { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px; }
.kind-heading strong { color:#285e68; font-size:17px; }
.kind-heading small { color:#91a09f; font-size:9px; letter-spacing:.12em; text-transform:uppercase; }
.variant-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.variant-card { min-width:0; margin:0; text-align:center; }
.variant-card .game-card { --card-width:136px; border-radius:17px; }
.variant-card figcaption { display:flex; align-items:center; justify-content:center; gap:6px; margin-top:8px; color:#667d80; font-size:10px; }
.variant-card figcaption b { display:grid; place-items:center; width:19px; height:19px; border-radius:50%; color:#fff; background:#177b89; font-size:9px; }
.export-mode { width:max-content; padding:24px; }
.export-mode .variant-sheet { display:grid; grid-template-columns:315px; }
.export-mode .kind-group { padding:0; border:0; background:transparent; box-shadow:none; }
.export-mode .kind-heading { display:none; }
.export-mode .variant-row { display:grid; grid-template-columns:315px; gap:24px; }
.export-mode .variant-card { width:315px; }
.export-mode .variant-card .game-card { --card-width:315px; border-radius:28px; }
.export-mode .variant-card figcaption { display:none; }
</style>

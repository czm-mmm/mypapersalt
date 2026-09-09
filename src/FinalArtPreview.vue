<script setup lang="ts">
import GameCard from './components/GameCard.vue'
import { createDeck, KIND_META } from './core/cards'
import type { CardKind } from './core/types'

const selections: Array<{ kind: CardKind; variant: 1 | 2 }> = [
  { kind: 'crab', variant: 1 },
  { kind: 'boat', variant: 1 },
  { kind: 'fish', variant: 1 },
  { kind: 'shark', variant: 2 },
  { kind: 'swimmer', variant: 1 },
  { kind: 'mermaid', variant: 2 },
  { kind: 'shell', variant: 1 },
  { kind: 'octopus', variant: 2 },
  { kind: 'penguin', variant: 2 },
  { kind: 'sailor', variant: 2 },
  { kind: 'lighthouse', variant: 2 },
  { kind: 'shoal', variant: 2 },
  { kind: 'penguin-colony', variant: 2 },
  { kind: 'captain', variant: 1 },
]

const deck = createDeck()
const collectorKinds: CardKind[] = ['shell', 'octopus', 'penguin', 'sailor']

function cardFor(kind: CardKind) {
  return deck.find((card) => card.kind === kind)!
}

function cardsFor(kind: CardKind) {
  return deck.filter((card) => card.kind === kind)
}
</script>

<template>
  <main class="final-page">
    <header>
      <p>ART DIRECTION · 已确认背景色保持不变</p>
      <h1>最终主题图案总览</h1>
      <span>14 种牌型，共 58 张；直接使用游戏中的真实组件与色号，只替换居中的透明折纸主体。</span>
    </header>

    <section class="collector-preview" aria-label="收藏牌累计分值预览">
      <div class="collector-heading">
        <div>
          <p>COLLECTION VALUES</p>
          <h2>右上角累计分值</h2>
        </div>
        <span>数字表示收集到对应张数时，该类别牌的总分</span>
      </div>
      <article v-for="kind in collectorKinds" :key="kind" class="collector-row">
        <h3>{{ KIND_META[kind].name }}</h3>
        <div class="collector-cards">
          <GameCard v-for="card in cardsFor(kind)" :key="card.id" :card="card" disabled />
        </div>
      </article>
    </section>

    <section class="card-grid">
      <figure v-for="item in selections" :key="item.kind">
        <div class="card-stage">
          <GameCard :card="cardFor(item.kind)" disabled />
        </div>
        <figcaption>
          <strong>{{ KIND_META[item.kind].name }}</strong>
          <span>方案 {{ item.variant }}</span>
        </figcaption>
      </figure>
    </section>
  </main>
</template>

<style>
* { box-sizing:border-box; }
html,body,#final-preview-app { min-height:100%; margin:0; }
body { background:#dce8e3; font-family:"Noto Sans SC","Microsoft YaHei",sans-serif; }
.final-page {
  width:100%;
  max-width:1600px;
  min-height:100vh;
  padding:48px 58px 66px;
  color:#244f59;
  background:linear-gradient(145deg,#edf3ef,#d9e7e1);
}
.final-page header { margin:0 0 34px; }
.final-page header p { margin:0 0 7px; color:#6f8789; font-size:13px; font-weight:800; letter-spacing:.18em; }
.final-page header h1 { margin:0 0 8px; color:#174f5e; font-family:"Playfair Display","Noto Serif SC",serif; font-size:42px; }
.final-page header span { color:#71878a; font-size:14px; }
.collector-preview {
  margin:0 0 42px;
  padding:26px 28px 30px;
  border:1px solid rgba(28,80,89,.1);
  border-radius:24px;
  background:rgba(255,255,255,.76);
  box-shadow:0 14px 34px rgba(30,74,78,.09);
}
.collector-heading { display:flex; align-items:end; justify-content:space-between; gap:24px; margin-bottom:24px; }
.collector-heading p { margin:0 0 5px; color:#7b9293; font-size:11px; font-weight:900; letter-spacing:.16em; }
.collector-heading h2 { margin:0; color:#174f5e; font-family:"Playfair Display","Noto Serif SC",serif; font-size:27px; }
.collector-heading > span { color:#71878a; font-size:13px; }
.collector-row { display:grid; grid-template-columns:72px minmax(0,1fr); align-items:center; gap:18px; padding:18px 0; border-top:1px solid rgba(36,79,89,.1); }
.collector-row h3 { margin:0; color:#285e68; font-size:17px; }
.collector-cards { display:flex; flex-wrap:wrap; gap:14px; }
.collector-cards .game-card { --card-width:118px; }
.card-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:32px 34px; }
.card-grid figure {
  min-width:0;
  margin:0;
  padding:25px 26px 18px;
  border:1px solid rgba(28,80,89,.1);
  border-radius:24px;
  background:rgba(255,255,255,.72);
  box-shadow:0 14px 34px rgba(30,74,78,.09);
}
.card-stage { width:272px; height:381px; margin:0 auto; }
.card-stage .game-card {
  --card-width:160px;
  transform:scale(1.7);
  transform-origin:top left;
}
.card-grid figcaption { display:flex; justify-content:space-between; align-items:center; margin-top:12px; }
.card-grid figcaption strong { color:#285e68; font-size:18px; }
.card-grid figcaption span { padding:5px 10px; border-radius:999px; color:#fff; background:#177b89; font-size:11px; font-weight:800; }
@media (max-width:760px) {
  .final-page { padding:28px 18px 44px; }
  .collector-heading { align-items:start; flex-direction:column; }
  .collector-row { grid-template-columns:1fr; }
  .collector-cards { gap:9px; }
  .collector-cards .game-card { --card-width:108px; }
}
</style>

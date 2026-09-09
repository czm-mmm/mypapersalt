<script setup lang="ts">
import { computed } from 'vue'
import { COLLECTOR_SCORE_GUIDES, COLOR_META, KIND_META, collectorCardValue } from '../core/cards'
import type { Card } from '../core/types'
import EffectMark from './EffectMark.vue'
import OrigamiArt from './OrigamiArt.vue'
import OrigamiArtConcept from './OrigamiArtConcept.vue'

const props = withDefaults(defineProps<{ card?: Card; hidden?: boolean; compact?: boolean; selected?: boolean; disabled?: boolean; conceptVariant?: 1 | 2 | 3 }>(), {
  hidden: false,
  compact: false,
  selected: false,
  disabled: false,
})

const palette = computed(() => props.card ? COLOR_META[props.card.color] : null)
const meta = computed(() => props.card ? KIND_META[props.card.kind] : null)
const printedCollectorValue = computed(() => props.card ? collectorCardValue(props.card) : null)
const scoreGuideLines = computed(() => props.card ? COLLECTOR_SCORE_GUIDES[props.card.kind] ?? null : null)
const scoreGuideLabel = computed(() => scoreGuideLines.value ? `累计计分：${scoreGuideLines.value.join('、')}` : '')
const KIND_THEMES: Record<NonNullable<typeof props.card>['kind'], { a: string; b: string; ink: string; accent: string }> = {
  crab: { a: '#efad82', b: '#d86657', ink: '#fffdf4', accent: '#f4cb94' },
  boat: { a: '#66bdca', b: '#287f9a', ink: '#fffdf4', accent: '#f1cc73' },
  fish: { a: '#62c9bc', b: '#208a8d', ink: '#fffdf4', accent: '#a7e1d5' },
  shark: { a: '#637f99', b: '#294a68', ink: '#ffffff', accent: '#aaa0d8' },
  swimmer: { a: '#83d1df', b: '#468db9', ink: '#ffffff', accent: '#ef9fb7' },
  mermaid: { a: '#fff8df', b: '#ebd59f', ink: '#3b5260', accent: '#e7a7bf' },
  shell: { a: '#f4c59c', b: '#dc8b6e', ink: '#553328', accent: '#ffe0b4' },
  octopus: { a: '#a48bd0', b: '#69509b', ink: '#34254f', accent: '#dc9ab6' },
  penguin: { a: '#abcbd0', b: '#405b68', ink: '#284550', accent: '#e7f0e9' },
  sailor: { a: '#d6bd79', b: '#678a68', ink: '#4a4124', accent: '#f3dd9b' },
  lighthouse: { a: '#f2d268', b: '#de844e', ink: '#533a20', accent: '#fff2b5' },
  shoal: { a: '#49cbb6', b: '#167d83', ink: '#ffffff', accent: '#9ee7d5' },
  'penguin-colony': { a: '#c8d7d8', b: '#728d99', ink: '#243e49', accent: '#eef5ef' },
  captain: { a: '#dc7a63', b: '#315b6a', ink: '#ffffff', accent: '#f3c477' },
}
const style = computed(() => {
  if (!palette.value || !props.card) return {}
  const theme = KIND_THEMES[props.card.kind]
  return {
    '--card-a': theme.a,
    '--card-b': theme.b,
    '--card-ink': theme.ink,
    '--kind-accent': theme.accent,
    '--score-color': palette.value.a,
  }
})
</script>

<template>
  <button
    type="button"
    class="game-card"
    :class="[{ hidden, compact, selected, collector: printedCollectorValue !== null }, card ? `kind-${card.kind}` : '']"
    :style="style"
    :disabled="disabled"
    :aria-label="hidden ? '牌背' : `${meta?.name}，${palette?.name}`"
  >
    <template v-if="hidden || !card">
      <div class="back-mark"><span>折</span><span>纸</span></div>
      <div class="back-wave" />
    </template>
    <template v-else>
      <svg class="wave-bands" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
        <path class="wave-middle" d="M-10 103 C6 86 18 99 32 78 C46 62 58 78 72 57 C86 41 98 55 112 34 L112 150 L-10 150 Z" />
        <path class="wave-lower" d="M-10 151 C6 134 18 147 32 126 C46 110 58 126 72 105 C86 89 98 103 112 82 L112 150 L-10 150 Z" />
        <path class="wave-line" d="M-10 103 C6 86 18 99 32 78 C46 62 58 78 72 57 C86 41 98 55 112 34" />
        <path class="wave-line wave-line-lower" d="M-10 151 C6 134 18 147 32 126 C46 110 58 126 72 105 C86 89 98 103 112 82" />
      </svg>
      <div class="card-topline">
        <span class="kind-name">{{ meta?.name }}</span>
        <span
          v-if="scoreGuideLines"
          class="collector-value score-guide"
          :aria-label="scoreGuideLabel"
        >
          <b v-for="value in scoreGuideLines" :key="value">{{ value }}</b>
        </span>
        <span
          v-else-if="printedCollectorValue !== null"
          class="collector-value"
          :aria-label="`累计 ${printedCollectorValue} 分`"
        >{{ printedCollectorValue }}</span>
        <EffectMark v-else class="card-effect" :kind="card.kind" />
      </div>
      <div class="art-wrap">
        <OrigamiArtConcept v-if="conceptVariant" :kind="card.kind" :variant="conceptVariant" />
        <OrigamiArt v-else :kind="card.kind" :count="card.artCount" />
      </div>
      <div class="card-footer">
        <span v-if="printedCollectorValue === null" class="type-chip">{{ meta?.short }}</span>
        <span class="color-name" :aria-label="`牌色：${palette?.name}`">
          <i />
          <em v-if="printedCollectorValue !== null">牌色</em>
          <span>{{ palette?.name }}</span>
        </span>
      </div>
    </template>
  </button>
</template>

<style scoped>
.game-card {
  --card-a: #5bc1ce;
  --card-b: #2f829c;
  --card-ink: #fff;
  --score-color: #5bc1ce;
  position: relative;
  width: var(--card-width, 118px);
  aspect-ratio: 5 / 7;
  flex: 0 0 auto;
  padding: 10px;
  border: 2px solid rgba(255,255,255,.78);
  border-radius: 14px;
  overflow: hidden;
  color: var(--card-ink);
  background:
    radial-gradient(circle at 78% 14%, rgba(255,255,255,.25), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--card-a) 80%, var(--kind-accent) 20%), var(--card-a));
  box-shadow: 0 9px 22px rgba(18,56,66,.18), inset 0 0 0 1px rgba(24,45,50,.12);
  transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
  cursor: pointer;
  text-align:left;
  vertical-align:top;
}
.game-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .13; background-image: repeating-linear-gradient(102deg, transparent 0 8px, rgba(255,255,255,.2) 8px 9px); mix-blend-mode:soft-light; }
.game-card:hover:not(:disabled) { transform: translateY(-6px); box-shadow: 0 14px 26px rgba(18,56,66,.25); }
.game-card.selected { transform: translateY(-10px); outline: 4px solid #fff6c5; outline-offset: 2px; }
.game-card:disabled { cursor: default; }
.wave-bands { position:absolute; z-index:0; inset:0; width:100%; height:100%; pointer-events:none; }
.wave-middle { fill:color-mix(in srgb, var(--card-b) 82%, var(--kind-accent) 18%); }
.wave-lower { fill:color-mix(in srgb, var(--card-b) 72%, #0b3442 28%); }
.wave-line { fill:none; stroke:rgba(255,255,255,.34); stroke-width:1.2; vector-effect:non-scaling-stroke; }
.card-topline,.card-footer { z-index: 3; display:flex; align-items:center; justify-content:space-between; gap:6px; font-weight:800; }
.card-topline { position:absolute; top:9px; left:10px; right:9px; min-height:27px; font-size:13px; letter-spacing:.08em; }
.kind-name { flex:0 0 auto; line-height:1.15; text-shadow:0 1px 3px rgba(18,46,52,.2); white-space:nowrap; }
.kind-shell .kind-name { transform:translateX(-2px); }
.collector .card-topline { display:grid; grid-template-columns:auto minmax(0,1fr); gap:0; }
.collector-value {
  display:grid;
  place-items:center;
  min-width:27px;
  height:27px;
  padding:0 5px;
  border:1px solid rgba(28,67,75,.14);
  border-radius:9px;
  color:#173f49;
  background:rgba(255,255,255,.94);
  box-shadow:0 2px 7px rgba(20,54,62,.2);
  font-size:14px;
  line-height:1;
  font-weight:900;
  letter-spacing:0;
}
.score-guide {
  display:flex;
  align-items:center;
  justify-content:center;
  gap:3px;
  min-width:0;
  height:20px;
  padding:0;
  border:0;
  border-radius:0;
  color:var(--card-ink);
  background:transparent;
  box-shadow:none;
  font-family:Arial,"Microsoft YaHei",sans-serif;
  font-size:9px;
  line-height:1;
}
.collector .score-guide { transform:translateX(5.5px); }
.collector.kind-shell .score-guide { transform:translateX(4.5px); }
.score-guide b { display:inline-flex; align-items:center; min-width:0; font:inherit; font-weight:900; letter-spacing:0; text-shadow:0 1px 2px rgba(255,255,255,.35); white-space:nowrap; }
.art-wrap {
  position:absolute;
  z-index:2;
  left:50%;
  top:50%;
  width:calc(100% - 12px);
  height:60%;
  transform:translate(-50%, -50%);
  display:grid;
  place-items:center;
}
.collector .art-wrap { top:49%; width:82%; height:49%; }
.collector.kind-shell .art-wrap { width:80%; height:45%; }
.collector.kind-octopus .art-wrap { width:82%; height:49%; }
.collector.kind-penguin .art-wrap { width:80%; height:47%; }
.collector.kind-sailor .art-wrap { top:50%; width:68%; height:52%; }
.game-card:not(.collector) .card-topline { display:grid; grid-template-columns:auto minmax(0,1fr); gap:4px; }
.card-topline .card-effect {
  justify-self:end;
  max-width:100%;
  padding:0;
  gap:3px;
  color:var(--card-ink);
  background:transparent;
  box-shadow:none;
  backdrop-filter:none;
}
.card-topline .card-effect :deep(svg) { width:12px; height:12px; }
.card-topline .card-effect :deep(b) { font-size:8px; }
.kind-penguin-colony .card-topline { font-size:11px; }
.kind-penguin-colony .card-topline .card-effect :deep(svg) { width:10px; height:10px; }
.kind-penguin-colony .card-topline .card-effect :deep(b) { font-size:7px; }
.card-footer { position:absolute; left:9px; right:9px; bottom:9px; font-size:10px; }
.collector .card-footer { justify-content:center; }
.type-chip { padding:4px 7px; border-radius:999px; background:rgba(255,255,255,.78); color:#22434b; }
.color-name {
  display:flex;
  align-items:center;
  gap:4px;
  padding:4px 7px 4px 5px;
  border:1px solid rgba(28,67,75,.12);
  border-radius:999px;
  color:#23454c;
  background:rgba(255,255,255,.88);
  box-shadow:0 2px 7px rgba(17,47,55,.14);
  line-height:1;
  opacity:1;
}
.color-name i { width:9px; height:9px; flex:0 0 auto; border-radius:50%; background:var(--score-color); border:1px solid rgba(255,255,255,.9); box-shadow:0 0 0 1px rgba(20,54,62,.28); }
.color-name em { color:#718386; font-size:8px; font-style:normal; font-weight:700; }
.color-name span { font-weight:900; white-space:nowrap; }
.hidden { background: linear-gradient(145deg,#f4e5c3,#d9b98b); }
.hidden::before { content:''; position:absolute; inset:7px; border:1px solid rgba(46,91,99,.28); border-radius:10px; background: repeating-radial-gradient(ellipse at 50% 110%, transparent 0 11px, rgba(29,110,124,.2) 12px 14px); }
.back-mark { position:absolute; z-index:2; inset:24% 23%; transform:rotate(-7deg); display:grid; place-items:center; grid-template-columns:1fr 1fr; border:2px solid #2c7884; color:#225c69; font-weight:900; font-size:22px; background:rgba(255,255,255,.34); }
.back-wave { position:absolute; z-index:1; left:-20%; right:-20%; bottom:-15%; height:52%; border-radius:50% 50% 0 0; background:#4ba9b8; opacity:.55; transform:rotate(-6deg); }
.compact { --card-width: 88px; border-radius:11px; padding:7px; }
.compact .card-topline { top:7px; left:7px; right:7px; font-size:10px; }
.compact .collector-value { min-width:20px; height:20px; padding:0 3px; border-radius:7px; font-size:11px; }
.compact .score-guide { min-width:0; height:18px; padding:0; gap:2px; font-size:8px; }
.compact .art-wrap { width:calc(100% - 6px); height:58%; }
.compact .card-topline .card-effect { transform:scale(.78); transform-origin:right center; }
.compact .card-footer { left:6px; right:6px; bottom:6px; }
.compact .type-chip { padding:3px 5px; font-size:8px; }
.compact .color-name { padding:3px; }
.compact .color-name i { width:9px; height:9px; }
.compact .color-name em,.compact .color-name span { display:none; }
</style>

<script setup lang="ts">
import { onMounted } from 'vue'
import GameCard from './components/GameCard.vue'
import { createDeck } from './core/cards'

const deck = createDeck()
const contact = new URLSearchParams(window.location.search).has('contact')

onMounted(async () => {
  await document.fonts.ready
  document.documentElement.dataset.exportReady = 'true'
})
</script>

<template>
  <main class="export-page" :class="{ contact }">
    <div class="export-sheet">
      <figure
        v-for="(card, index) in deck"
        :key="card.id"
        class="export-card"
        :data-card-id="card.id"
        :data-file="`${String(index + 1).padStart(2, '0')}_${card.id}_${card.color}.png`"
      >
        <GameCard :card="card" disabled />
        <figcaption>{{ String(index + 1).padStart(2, '0') }} · {{ card.id }} · {{ card.color }}</figcaption>
      </figure>
    </div>
  </main>
</template>

<style>
* { box-sizing:border-box; }
html,body,#export-app { min-height:100%; margin:0; }
body { background:transparent; font-family:"Noto Sans SC","Microsoft YaHei",sans-serif; }
.export-page { width:max-content; padding:24px; background:#edf3ef; }
.export-sheet { display:grid; grid-template-columns:315px; gap:24px; }
.export-card { width:315px; margin:0; }
.export-card .game-card { --card-width:315px; border-radius:28px; }
.export-card figcaption { display:none; }
.contact { width:1550px; padding:34px; background:#e8f0ec; }
.contact .export-sheet { grid-template-columns:repeat(10, 1fr); gap:22px 16px; }
.contact .export-card { width:132px; text-align:center; }
.contact .export-card .game-card { --card-width:132px; border-radius:16px; }
.contact .export-card figcaption { display:block; overflow:hidden; margin-top:7px; color:#45636a; font-size:10px; line-height:1.3; white-space:nowrap; text-overflow:ellipsis; }
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardKind } from '../core/types'

const props = defineProps<{ kind: CardKind }>()

const effect = computed(() => {
  switch (props.kind) {
    case 'crab': return { icon: 'search', label: '查弃牌' }
    case 'boat': return { icon: 'repeat', label: '再行动' }
    case 'fish': return { icon: 'draw', label: '摸 1' }
    case 'shark':
    case 'swimmer': return { icon: 'steal', label: '偷 1' }
    case 'mermaid': return { icon: 'colors', label: '主色计分' }
    case 'shell':
    case 'octopus':
    case 'penguin':
    case 'sailor': return { icon: 'set', label: '套组' }
    case 'lighthouse': return { icon: 'bonus', label: '船 +1' }
    case 'shoal': return { icon: 'bonus', label: '鱼 +1' }
    case 'penguin-colony': return { icon: 'bonus', label: '企鹅 +2' }
    case 'captain': return { icon: 'bonus', label: '水手 +3' }
  }
})
</script>

<template>
  <span class="effect-mark" :aria-label="effect.label">
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <template v-if="effect.icon === 'search'">
        <rect x="3" y="4" width="9" height="11" rx="1.5" />
        <circle cx="13.5" cy="12.5" r="3" />
        <path d="m15.7 14.7 2.2 2.2" />
      </template>
      <template v-else-if="effect.icon === 'repeat'">
        <path d="M4 7.5A6 6 0 0 1 15 6l1.5 1.5M16 12.5A6 6 0 0 1 5 14l-1.5-1.5" />
        <path d="m13.7 7.6 3-.1-.1-3M6.3 12.4l-3 .1.1 3" />
      </template>
      <template v-else-if="effect.icon === 'draw'">
        <rect x="4" y="3" width="9" height="13" rx="1.5" />
        <path d="M9 7v5M6.5 9.5h5M13 6h3v11H8v-1" />
      </template>
      <template v-else-if="effect.icon === 'steal'">
        <rect x="11" y="3" width="6" height="9" rx="1" />
        <path d="M3 15.5h6.5c2.6 0 4-1.2 4-3.5M7 12l-4 3.5L7 19" />
      </template>
      <template v-else-if="effect.icon === 'colors'">
        <path d="M10 2.5C6.5 6.6 4.4 8.9 4.4 12A5.6 5.6 0 0 0 15.6 12C15.6 8.9 13.5 6.6 10 2.5Z" />
        <path d="M7 13.5c.7 1.2 1.8 1.8 3.2 1.8" />
      </template>
      <template v-else-if="effect.icon === 'set'">
        <rect x="3" y="5" width="8" height="11" rx="1.2" />
        <rect x="8.5" y="3" width="8" height="11" rx="1.2" />
        <path d="M11 7h3M11 10h3" />
      </template>
      <template v-else>
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6v8M6 10h8" />
      </template>
    </svg>
    <b>{{ effect.label }}</b>
  </span>
</template>

<style scoped>
.effect-mark {
  display:flex;
  align-items:center;
  gap:4px;
  min-width:0;
  padding:3px 6px 3px 4px;
  border-radius:999px;
  color:#173f49;
  background:rgba(255,255,255,.84);
  box-shadow:0 3px 9px rgba(12,45,53,.12);
  backdrop-filter:blur(3px);
}
svg { width:14px; height:14px; flex:0 0 auto; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
b { overflow:hidden; font-size:8px; line-height:1; font-weight:900; letter-spacing:.02em; white-space:nowrap; text-overflow:ellipsis; }
</style>

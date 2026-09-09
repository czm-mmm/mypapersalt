<script setup lang="ts">
import { computed } from 'vue'
import type { CardKind } from '../core/types'

const props = defineProps<{ kind: CardKind; count?: 1 | 2 }>()

const artSrc = computed(() => `${import.meta.env.BASE_URL}card-art-v2/${props.kind}.png`)
</script>

<template>
  <img
    class="origami"
    :src="artSrc"
    alt=""
    aria-hidden="true"
    draggable="false"
  >
</template>

<style scoped>
.origami {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 7px 6px rgba(12, 39, 47, .2));
}
</style>

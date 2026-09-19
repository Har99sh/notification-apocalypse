<script setup lang="ts">
import { useGameStore } from '~/stores/game'
const game = useGameStore()
const percent = computed(() => {
  const max = game.reorientationRemaining <= 2 ? 2 : game.reorientationRemaining <= 4 ? 4 : 7
  return 100 - (game.reorientationRemaining / max) * 100
})
</script>

<template>
  <div v-if="game.reorientationRemaining > 0" class="reorientation" role="status">
    <span class="spinner" aria-hidden="true" />
    <div><strong>Rebuilding mental context…</strong><small>{{ game.reorientationRemaining.toFixed(1) }}s</small><div class="reorient-track"><i :style="{ width: `${percent}%` }" /></div></div>
  </div>
</template>

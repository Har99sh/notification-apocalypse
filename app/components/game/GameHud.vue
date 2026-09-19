<script setup lang="ts">
import { useGameStore } from '~/stores/game'
const game = useGameStore()
const time = computed(() => {
  const seconds = Math.ceil(game.timeRemaining)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})
</script>

<template>
  <header class="hud" aria-label="Workday status">
    <div class="hud-stat"><span>Report</span><strong>{{ Math.round(game.reportProgress) }}%</strong><div class="meter"><i :style="{ width: `${game.reportProgress}%` }" /></div></div>
    <div class="hud-stat"><span>Focus</span><strong>{{ Math.round(game.focus) }}</strong><div class="meter"><i :style="{ width: `${game.focus}%` }" /></div></div>
    <div class="hud-stat" :data-level="game.loadLevel"><span>Load</span><strong>{{ Math.round(game.cognitiveLoad) }}</strong><div class="meter load"><i :style="{ width: `${game.cognitiveLoad}%` }" /></div></div>
    <div class="hud-stat time"><span>Remaining</span><strong>{{ time }}</strong><small>{{ game.currentWave }}</small></div>
  </header>
</template>

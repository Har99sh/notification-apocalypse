<script setup lang="ts">
import { useGameStore } from '~/stores/game'
import type { OptimalAction } from '~/types/game'
const game = useGameStore()
const choose = (id: string, action: OptimalAction) => game.choose(id, action)
</script>

<template>
  <aside class="attention-rail" aria-label="Notifications">
    <div class="rail-heading"><span>Attention queue</span><b>{{ game.visible.length }} / 5</b></div>
    <div aria-live="polite" class="sr-only">{{ game.visible.at(-1)?.category !== 'urgent' ? game.visible.at(-1)?.title : '' }}</div>
    <div aria-live="assertive" class="sr-only">{{ game.visible.at(-1)?.category === 'urgent' && game.visible.at(-1)?.chainId === 'incident' ? game.visible.at(-1)?.title : '' }}</div>
    <TransitionGroup name="stack" tag="div" class="card-stack">
      <GameNotificationCard v-for="(item, index) in game.visible" :key="item.instanceId" :item="item" :index="index" :reduced-effects="game.settings.reducedEffects" @choose="choose" />
    </TransitionGroup>
    <div v-if="!game.visible.length" class="quiet-state"><span>✦</span><p>All quiet. Keep writing.</p></div>
    <p class="swipe-hint">Swipe ← ignore · ↓ snooze · → open</p>
  </aside>
</template>

<script setup lang="ts">
import { useGameStore } from '~/stores/game'
const game = useGameStore()
const paragraphs = [
  'This quarter taught us that momentum is less about moving quickly and more about protecting the conditions that let good work happen.',
  'The project began with a clear goal: simplify the customer journey while keeping the system reliable under pressure.',
  'Across the team, the strongest results came from focused collaboration, small experiments, and decisions made with enough context.',
  'Our next phase will turn those lessons into durable habits, clearer ownership, and a calmer operating rhythm.',
]
const typedText = computed(() => {
  const full = paragraphs.join('\n\n')
  return full.slice(0, Math.floor((game.reportProgress / 100) * full.length))
})
</script>

<template>
  <section class="document-wrap" :class="`load-${game.loadLevel}`" aria-label="Work document">
    <div class="document-toolbar"><span /><span /><span /><em>Saved</em></div>
    <article class="document">
      <p class="document-kicker">INTERNAL · DRAFT</p>
      <h1>Q4 Project Retrospective</h1>
      <p class="byline">Prepared by You · Today</p>
      <div class="typed-copy">{{ typedText }}<span v-if="game.reportProgress < 100" class="cursor" aria-hidden="true" /></div>
      <div v-if="!typedText" class="skeleton-lines" aria-hidden="true"><i /><i /><i /></div>
    </article>
  </section>
</template>

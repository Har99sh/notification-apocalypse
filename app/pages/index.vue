<script setup lang="ts">
import { useGameStore } from '~/stores/game'
const game = useGameStore()
const clientReady = ref(false)
useGameEngine()
useGameAudio()

onMounted(() => {
  game.hydrate()
  game.setSpeed(new URLSearchParams(window.location.search).get('speed'))
  clientReady.value = true
})

function begin() {
  if (game.settings.tutorialSeen) game.startGame()
  else game.showTutorial()
}

function keydown(event: KeyboardEvent) {
  if (game.phase !== 'playing' || game.opened || !game.visible.length) return
  const action = event.key === '1' ? 'ignore' : event.key === '2' ? 'snooze' : event.key === '3' ? 'open' : null
  if (action) { event.preventDefault(); game.choose(game.visible[0]!.instanceId, action) }
  if (event.key.toLowerCase() === 'p') game.pause()
}
onMounted(() => window.addEventListener('keydown', keydown))
onBeforeUnmount(() => window.removeEventListener('keydown', keydown))
</script>

<template>
  <div class="app-shell" :class="[`phase-${game.phase}`, `load-${game.loadLevel}`, { 'reduced-effects': game.settings.reducedEffects }]">
    <button v-if="game.phase !== 'result'" type="button" class="sound-toggle" :disabled="!clientReady" :aria-pressed="game.settings.soundEnabled" :aria-label="game.settings.soundEnabled ? 'Mute sound' : 'Enable sound'" @click="game.toggleSound">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path v-if="game.settings.soundEnabled" d="M16 9c1 2 1 4 0 6M19 6c3 4 3 8 0 12" /><path v-else d="M17 9l5 6M22 9l-5 6" /></svg>
      <span>{{ game.settings.soundEnabled ? 'Sound on' : 'Sound off' }}</span>
    </button>

    <main v-if="game.phase === 'landing'" class="landing">
      <div class="calm-orbit orbit-one" /><div class="calm-orbit orbit-two" />
      <p class="eyebrow">A THREE-MINUTE FOCUS GAME</p>
      <h1><span>Notification</span> Apocalypse</h1>
      <p class="tagline">Finish your report while every app on Earth fights for your attention.</p>
      <div class="landing-actions">
        <button type="button" class="primary-button" :disabled="!clientReady" @click="begin">Start workday <span>→</span></button>
        <button type="button" class="secondary-button" :disabled="!clientReady" @click="game.showTutorial">How to play</button>
      </div>
      <p v-if="game.settings.bestScore" class="personal-best">Personal best <strong>{{ game.settings.bestScore.toLocaleString() }}</strong> · Grade {{ game.settings.bestGrade }}</p>
      <div class="landing-preview" aria-hidden="true"><div class="mini-doc"><i /><i /><i /><i /></div><div class="mini-note">All quiet—for now.</div></div>
    </main>

    <div v-else-if="game.phase === 'tutorial'" class="tutorial-screen">
      <section class="tutorial-panel" aria-labelledby="tutorial-title">
        <p class="eyebrow">YOUR BRIEFING</p><h1 id="tutorial-title">Protect the work. Triage the chaos.</h1>
        <div class="tutorial-cards">
          <article><b>01</b><span class="tutorial-icon">◎</span><h2>Protect focus</h2><p>Your report advances while you are not distracted.</p></article>
          <article><b>02</b><span class="tutorial-icon">⇆</span><h2>Triage fast</h2><p>Ignore noise, snooze useful items, open true emergencies.</p></article>
          <article><b>03</b><span class="tutorial-icon">↻</span><h2>Opening has a cost</h2><p>Every context switch pauses work and makes it harder to refocus.</p></article>
        </div>
        <div class="key-guide"><span><kbd>1</kbd> Ignore</span><span><kbd>2</kbd> Snooze</span><span><kbd>3</kbd> Open</span></div>
        <div class="tutorial-actions"><button type="button" class="primary-button" @click="game.startGame">Got it — start</button><button type="button" class="text-button" @click="game.startGame">Skip</button></div>
      </section>
    </div>

    <template v-else-if="game.phase === 'playing' || game.phase === 'paused'">
      <div class="game-screen">
        <GameHud />
        <button type="button" class="pause-button" aria-label="Pause workday" @click="game.pause">Ⅱ</button>
        <div class="game-layout"><GameWorkDocument /><GameNotificationStack /></div>
        <GameReorientationOverlay />
        <div v-if="game.incidentActive && game.reorientationRemaining <= 0" class="reorientation incident-block" role="status"><span class="spinner" aria-hidden="true" /><div><strong>Production incident blocks publishing…</strong><small>rollback needed</small><div class="reorient-track"><i style="width:68%" /></div></div></div>
        <Transition name="chip"><div v-if="game.resultChip" :key="game.resultChip" class="result-chip" role="status">{{ game.resultChip }}</div></Transition>
        <Transition name="chip"><div v-if="game.consequenceMessage" class="consequence-toast" role="alert"><strong>AFTERMATH</strong>{{ game.consequenceMessage }}</div></Transition>
        <GameNotificationDetail v-if="game.opened" />
      </div>
      <div v-if="game.phase === 'paused'" class="pause-overlay">
        <section><p class="eyebrow">WORKDAY PAUSED</p><h1>Your focus is safe here.</h1><p>Nothing advances while you’re away.</p><button type="button" class="primary-button" @click="game.resume">Resume workday</button><label><input type="checkbox" :checked="game.settings.reducedEffects" @change="game.toggleReducedEffects"> Reduce motion and visual effects</label></section>
      </div>
    </template>
    <GameResultSummary v-else-if="game.phase === 'result' && game.result" />
  </div>
</template>

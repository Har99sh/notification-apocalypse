<script setup lang="ts">
import { useGameStore } from '~/stores/game'
import { verdictForGrade } from '~/utils/gameRules'
const game = useGameStore()
const { share, shareStatus } = useShareResult()
const result = computed(() => game.result!)
const isBest = computed(() => result.value.score === game.settings.bestScore && result.value.score > 0)
</script>

<template>
  <main class="result-screen">
    <div class="result-glow" />
    <p class="eyebrow">WORKDAY COMPLETE</p>
    <div class="grade" :data-grade="result.grade">{{ result.grade }}</div>
    <h1>{{ result.success ? 'Report delivered.' : result.failureReason === 'incident' ? 'Production won.' : result.failureReason === 'burnout' ? 'Focus depleted.' : 'Time’s up.' }}</h1>
    <p class="verdict">{{ verdictForGrade(result.grade) }}</p>
    <div class="score-line"><strong>{{ result.score.toLocaleString() }}</strong><span>points</span><b v-if="isBest">NEW BEST</b></div>
    <dl class="results-grid">
      <div><dt>Report</dt><dd>{{ result.reportProgress }}%</dd></div>
      <div><dt>Triage accuracy</dt><dd>{{ result.triageAccuracy }}%</dd></div>
      <div><dt>Context switches</dt><dd>{{ result.contextSwitches }}</dd></div>
      <div><dt>False urgencies</dt><dd>{{ result.falseUrgenciesOpened }}</dd></div>
      <div><dt>Emergencies missed</dt><dd>{{ result.emergenciesMissed }}</dd></div>
      <div><dt>Deep-work streak</dt><dd>{{ result.deepWorkStreak }}s</dd></div>
    </dl>
    <div v-if="result.achievement" class="achievement"><span>✦</span><div><small>ACHIEVEMENT</small><strong>Emotionally Unavailable</strong><p>You ignored Pip six times. Pip will journal about this.</p></div></div>
    <div class="result-actions">
      <button type="button" class="primary-button" @click="game.startGame">Play again</button>
      <button type="button" class="secondary-button" @click="share(result)">Share result</button>
    </div>
    <p class="share-status" role="status">{{ shareStatus }}</p>
  </main>
</template>

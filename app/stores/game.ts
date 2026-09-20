import { defineStore } from 'pinia'
import { consequences } from '~/data/consequences'
import { notificationById, notifications } from '~/data/notifications'
import type { ActiveNotification, FailureReason, GameNotification, GamePhase, OptimalAction, PendingConsequence, PersistedSettings, ResultStats } from '~/types/game'
import { actionPoints, focusProgressMultiplier, gradeForScore, loadProgressMultiplier, PRODUCTIVE_SECONDS, reorientationDuration, RUN_SECONDS, seededRandom, STORAGE_KEY } from '~/utils/gameRules'
import { defaultSettings, parseSettings } from '~/utils/persistence'

interface ScheduledNotification { item: GameNotification; dueAt: number; snoozed: boolean }

interface GameState {
  phase: GamePhase
  elapsed: number
  reportProgress: number
  focus: number
  cognitiveLoad: number
  score: number
  visible: ActiveNotification[]
  waiting: ActiveNotification[]
  scheduled: ScheduledNotification[]
  consequences: PendingConsequence[]
  opened: ActiveNotification | null
  reorientationRemaining: number
  freezeRemaining: number
  contextSwitches: number
  correctTriage: number
  totalTriage: number
  falseUrgenciesOpened: number
  emergenciesMissed: number
  currentDeepStreak: number
  longestDeepStreak: number
  pipIgnored: number
  achievement: boolean
  incidentActive: boolean
  incidentResolved: boolean
  result: ResultStats | null
  resultChip: string
  consequenceMessage: string
  speed: number
  seed: number
  runNumber: number
  settings: PersistedSettings
  resumePhase: 'playing' | 'landing'
}

function createSchedule(seed: number): ScheduledNotification[] {
  const random = seededRandom(seed)
  return notifications
    .filter(item => item.appearsAt < 900)
    .map(item => ({ item, dueAt: Math.max(1, item.appearsAt + (random() - 0.5) * 1.2), snoozed: false }))
    .sort((a, b) => a.dueAt - b.dueAt)
}

let instanceCounter = 0

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    phase: 'landing', elapsed: 0, reportProgress: 0, focus: 100, cognitiveLoad: 0, score: 1000,
    visible: [], waiting: [], scheduled: [], consequences: [], opened: null, reorientationRemaining: 0, freezeRemaining: 0,
    contextSwitches: 0, correctTriage: 0, totalTriage: 0, falseUrgenciesOpened: 0, emergenciesMissed: 0,
    currentDeepStreak: 0, longestDeepStreak: 0, pipIgnored: 0, achievement: false, incidentActive: false, incidentResolved: false,
    result: null, resultChip: '', consequenceMessage: '', speed: 1, seed: 104729, runNumber: 0,
    settings: defaultSettings(), resumePhase: 'landing',
  }),
  getters: {
    timeRemaining: state => Math.max(0, RUN_SECONDS - state.elapsed),
    currentWave: (state): string => {
      if (state.elapsed < 35) return 'Wave 1 · Inbox drizzle'
      if (state.elapsed < 75) return 'Wave 2 · Quick things'
      if (state.elapsed < 125) return 'Wave 3 · Mascot escalation'
      return 'Wave 4 · Incident storm'
    },
    isProductive: state => state.phase === 'playing' && !state.opened && state.reorientationRemaining <= 0 && state.freezeRemaining <= 0,
    loadLevel: state => state.cognitiveLoad >= 85 ? 'critical' : state.cognitiveLoad >= 60 ? 'high' : state.cognitiveLoad >= 50 ? 'warm' : 'calm',
  },
  actions: {
    hydrate() {
      if (!import.meta.client) return
      this.settings = parseSettings(localStorage.getItem(STORAGE_KEY))
    },
    persist() {
      if (import.meta.client) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
    },
    setSpeed(raw: unknown) {
      const parsed = Number(raw)
      this.speed = Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : 1
    },
    showTutorial() { this.phase = 'tutorial' },
    startGame() {
      if (import.meta.client) this.setSpeed(new URLSearchParams(window.location.search).get('speed'))
      this.runNumber += 1
      const nextSeed = this.runNumber === 1 ? 104729 : Math.floor(Math.random() * 1_000_000) + 1
      this.phase = 'playing'; this.elapsed = 0; this.reportProgress = 0; this.focus = 100; this.cognitiveLoad = 0; this.score = 1000
      this.visible = []; this.waiting = []; this.scheduled = createSchedule(nextSeed); this.consequences = []; this.opened = null
      this.reorientationRemaining = 0; this.freezeRemaining = 0; this.contextSwitches = 0; this.correctTriage = 0; this.totalTriage = 0
      this.falseUrgenciesOpened = 0; this.emergenciesMissed = 0; this.currentDeepStreak = 0; this.longestDeepStreak = 0
      this.pipIgnored = 0; this.achievement = false; this.incidentActive = false; this.incidentResolved = false; this.result = null; this.resultChip = ''; this.consequenceMessage = ''; this.seed = nextSeed
      this.settings.tutorialSeen = true
      this.persist()
    },
    pause() {
      if (this.phase === 'playing') { this.resumePhase = 'playing'; this.phase = 'paused' }
    },
    resume() { if (this.phase === 'paused') this.phase = this.resumePhase },
    toggleSound() { this.settings.soundEnabled = !this.settings.soundEnabled; this.persist() },
    toggleReducedEffects() { this.settings.reducedEffects = !this.settings.reducedEffects; this.persist() },
    tick(realDeltaSeconds: number) {
      if (this.phase !== 'playing') return
      const delta = Math.min(realDeltaSeconds * this.speed, 1)
      this.elapsed += delta
      this.reorientationRemaining = Math.max(0, this.reorientationRemaining - delta)
      this.freezeRemaining = Math.max(0, this.freezeRemaining - delta)

      const loadRate = this.visible.reduce((sum, item) => sum + item.loadPerSecond, 0)
      this.cognitiveLoad = Math.min(100, this.cognitiveLoad + loadRate * delta)

      const due = this.scheduled.filter(entry => entry.dueAt <= this.elapsed)
      this.scheduled = this.scheduled.filter(entry => entry.dueAt > this.elapsed)
      for (const entry of due) this.enqueue(entry.item, entry.snoozed)
      this.fillVisible()

      for (const item of [...this.visible, ...this.waiting]) {
        if (item.category === 'urgent' && item.expiresAfterSeconds && this.elapsed >= item.appearedAtElapsed + item.expiresAfterSeconds) {
          this.removeNotification(item.instanceId)
          this.triggerConsequence(item)
        }
      }
      for (const pending of this.consequences.filter(item => !item.resolved && item.dueAt <= this.elapsed)) {
        pending.resolved = true
        const definition = notificationById(pending.notificationId)
        if (definition) this.applyConsequence(definition, pending.catastrophic)
      }

      if (this.isProductive) {
        const multiplier = focusProgressMultiplier(this.focus) * loadProgressMultiplier(this.cognitiveLoad)
        this.reportProgress = Math.min(100, this.reportProgress + (delta / PRODUCTIVE_SECONDS) * 100 * multiplier)
        this.currentDeepStreak += delta
        this.longestDeepStreak = Math.max(this.longestDeepStreak, this.currentDeepStreak)
      } else {
        this.currentDeepStreak = 0
      }

      if (this.focus <= 0) this.finish(false, 'burnout')
      else if (this.reportProgress >= 100) this.finish(true, null)
      else if (this.elapsed >= RUN_SECONDS) this.finish(false, 'timeout')
    },
    enqueue(item: GameNotification, snoozed = false, dueOverride?: number) {
      if (dueOverride !== undefined) {
        this.scheduled.push({ item, dueAt: dueOverride, snoozed })
        this.scheduled.sort((a, b) => a.dueAt - b.dueAt)
        return
      }
      const active: ActiveNotification = { ...item, instanceId: `${item.id}-${++instanceCounter}`, appearedAtElapsed: this.elapsed, snoozed }
      if (this.visible.length < 5) this.visible.push(active)
      else if (item.category === 'urgent') {
        if (this.incidentActive && item.id !== 'rollback' && this.visible.some(entry => entry.id === 'rollback')) {
          this.waiting.unshift(active)
          return
        }
        const replaceIndex = this.visible.findLastIndex(entry => entry.category !== 'urgent')
        if (replaceIndex >= 0) {
          const displaced = this.visible.splice(replaceIndex, 1)[0]
          this.visible.unshift(active)
          if (displaced) this.waiting.unshift(displaced)
        } else this.waiting.push(active)
      } else this.waiting.push(active)
    },
    fillVisible() {
      while (this.visible.length < 5 && this.waiting.length) {
        const item = this.waiting.shift()
        if (item) { item.appearedAtElapsed = this.elapsed; this.visible.push(item) }
      }
    },
    choose(instanceId: string, action: OptimalAction) {
      if (this.phase !== 'playing' || this.opened) return
      const item = this.visible.find(entry => entry.instanceId === instanceId)
      if (!item) return
      this.totalTriage += 1
      const points = actionPoints(action, item.optimalAction, item.acceptableActions)
      this.score += points
      if (action === item.optimalAction) this.correctTriage += 1

      if (action === 'open') {
        this.contextSwitches += 1
        this.score -= 20
        this.focus = Math.max(0, this.focus - item.focusCostOnOpen)
        if (item.category === 'noise') this.falseUrgenciesOpened += 1
        this.opened = item
        this.resultChip = item.category === 'noise' ? `Context switch · −${item.focusCostOnOpen} focus` : 'Opened · choose a response'
        return
      }

      this.removeNotification(instanceId)
      if (action === 'ignore' && item.category === 'noise') {
        this.focus = Math.min(100, this.focus + 1)
        this.resultChip = 'Good call · noise blocked'
        if (item.chainId === 'pip') this.advancePip(item)
      } else if (action === 'snooze') {
        this.resultChip = action === item.optimalAction ? 'Parked for later · focus protected' : 'Snoozed · not the cleanest call'
        if (!item.snoozed) this.enqueue(item, true, this.elapsed + (item.snoozeSeconds ?? 22))
      } else {
        this.resultChip = item.category === 'urgent' ? 'Important alert missed' : 'Decision made · keep moving'
      }

      if (item.category === 'urgent') this.scheduleConsequence(item)
      this.score = Math.max(0, this.score)
    },
    resolveDetail(result: 'correct' | 'neutral' | 'wrong') {
      const item = this.opened
      if (!item) return
      this.opened = null
      this.removeNotification(item.instanceId)
      this.reorientationRemaining = reorientationDuration(item.complexity)
      if (result === 'correct') {
        if (item.category === 'urgent') this.score += 180
        this.cancelConsequence(item.id)
        this.resultChip = item.id === 'rollback' ? 'Service restored · crisis avoided' : 'Emergency handled · crisis avoided'
        if (item.id === 'checkout-spike') {
          this.incidentActive = true
          this.freezeRemaining = RUN_SECONDS
          const rollback = notificationById('rollback')
          if (rollback) this.enqueue(rollback, false, this.elapsed + 2.5)
        }
        if (item.id === 'rollback') { this.incidentActive = false; this.incidentResolved = true; this.freezeRemaining = 0; this.score += 400 }
      } else if (result === 'wrong') {
        this.score -= 80
        this.resultChip = 'That made things worse'
        if (item.category === 'urgent') this.scheduleConsequence(item, 2)
      } else {
        this.resultChip = 'Context closed · rebuilding focus'
        if (item.category === 'urgent') this.scheduleConsequence(item)
      }
      this.cognitiveLoad = Math.max(0, this.cognitiveLoad - 2)
      this.score = Math.max(0, this.score)
    },
    closeDetail() { this.resolveDetail('neutral') },
    removeNotification(instanceId: string) {
      this.visible = this.visible.filter(item => item.instanceId !== instanceId)
      this.waiting = this.waiting.filter(item => item.instanceId !== instanceId)
      this.cognitiveLoad = Math.max(0, this.cognitiveLoad - 2)
      this.fillVisible()
    },
    scheduleConsequence(item: GameNotification, delay?: number) {
      if (!item.consequenceId) return
      const existing = this.consequences.find(entry => entry.notificationId === item.id && !entry.resolved)
      if (existing) return
      this.consequences.push({ notificationId: item.id, consequenceId: item.consequenceId, dueAt: this.elapsed + (delay ?? item.expiresAfterSeconds ?? 15), catastrophic: Boolean(item.catastrophic), resolved: false })
    },
    cancelConsequence(notificationId: string) {
      this.consequences.forEach(item => { if (item.notificationId === notificationId) item.resolved = true })
    },
    triggerConsequence(item: GameNotification) {
      if (item.consequenceId) this.applyConsequence(item, Boolean(item.catastrophic))
    },
    applyConsequence(item: GameNotification, catastrophic: boolean) {
      const consequence = item.consequenceId ? consequences[item.consequenceId] : undefined
      if (!consequence) return
      this.emergenciesMissed += 1
      this.score = Math.max(0, this.score - 250)
      this.focus = Math.max(0, this.focus - consequence.focusLoss)
      this.freezeRemaining = Math.max(this.freezeRemaining, consequence.freezeSeconds)
      this.consequenceMessage = consequence.message
      this.resultChip = 'Consequence · emergency missed'
      if (catastrophic) this.finish(false, 'incident')
    },
    advancePip(item: GameNotification) {
      this.pipIgnored = Math.max(this.pipIgnored, item.chainStep ?? 0)
      if (this.pipIgnored >= 6) {
        this.achievement = true
        this.score += 150
        this.resultChip = 'Achievement · Emotionally Unavailable'
        return
      }
      const next = notificationById(`pip-${this.pipIgnored + 1}`)
      if (next) this.enqueue(next, false, this.elapsed + Math.max(2.8, 6.5 - this.pipIgnored * 0.55))
    },
    finish(success: boolean, failureReason: FailureReason) {
      if (this.phase === 'result') return
      if (success) {
        this.score += 500 + Math.round(this.focus * 5) + Math.floor(Math.max(0, RUN_SECONDS - this.elapsed)) * 10
      }
      this.score = Math.max(0, Math.round(this.score))
      const catastrophic = failureReason === 'incident'
      const grade = gradeForScore(this.score, catastrophic)
      this.result = {
        score: this.score, grade, reportProgress: Math.round(this.reportProgress),
        triageAccuracy: this.totalTriage ? Math.round((this.correctTriage / this.totalTriage) * 100) : 0,
        contextSwitches: this.contextSwitches, falseUrgenciesOpened: this.falseUrgenciesOpened,
        emergenciesMissed: this.emergenciesMissed, deepWorkStreak: Math.floor(this.longestDeepStreak),
        success, failureReason, achievement: this.achievement,
      }
      this.phase = 'result'
      this.settings.completedRuns += 1
      if (this.score > this.settings.bestScore) { this.settings.bestScore = this.score; this.settings.bestGrade = grade }
      this.persist()
    },
  },
})

export { createSchedule }

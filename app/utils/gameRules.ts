import type { Complexity, Grade, OptimalAction } from '~/types/game'

export const RUN_SECONDS = 180
export const PRODUCTIVE_SECONDS = 120
export const STORAGE_KEY = 'notification-apocalypse:v1'

export function actionPoints(action: OptimalAction, optimal: OptimalAction, acceptable: OptimalAction[] = []): number {
  if (action === optimal) return 100
  if (acceptable.includes(action)) return 35
  if (optimal === 'ignore' && action === 'snooze') return 35
  if (optimal === 'snooze' && (action === 'ignore' || action === 'open')) return 35
  return -80
}

export function focusProgressMultiplier(focus: number): number {
  if (focus < 25) return 0.55
  if (focus < 50) return 0.8
  return 1
}

export function loadProgressMultiplier(load: number): number {
  return load >= 85 ? 0.75 : 1
}

export function reorientationDuration(complexity: Complexity): number {
  return complexity === 'low' ? 2 : complexity === 'high' ? 7 : 4
}

export function gradeForScore(score: number, catastrophic = false): Grade {
  if (catastrophic) return 'F'
  if (score >= 3900) return 'S'
  if (score >= 3300) return 'A'
  if (score >= 2700) return 'B'
  if (score >= 2100) return 'C'
  if (score >= 1400) return 'D'
  return 'F'
}

export function verdictForGrade(grade: Grade): string {
  return {
    S: 'Unbothered. Focused. Frighteningly efficient.',
    A: 'You controlled the notifications. Mostly.',
    B: 'Productive, with several unnecessary side quests.',
    C: 'The report survived. Your attention did not.',
    D: 'You attended every fire drill, including the fake ones.',
    F: 'The notifications have unionized and taken control.',
  }[grade]
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

import type { PersistedSettings } from '~/types/game'

export const defaultSettings = (): PersistedSettings => ({
  version: 1,
  bestScore: 0,
  bestGrade: null,
  completedRuns: 0,
  tutorialSeen: false,
  soundEnabled: false,
  reducedEffects: false,
})

export function parseSettings(raw: string | null): PersistedSettings {
  if (!raw) return defaultSettings()
  try {
    const value = JSON.parse(raw) as Partial<PersistedSettings>
    if (value.version !== 1) return defaultSettings()
    const grades = ['S', 'A', 'B', 'C', 'D', 'F', null]
    if (typeof value.bestScore !== 'number' || !grades.includes(value.bestGrade ?? null)) return defaultSettings()
    return {
      version: 1,
      bestScore: Math.max(0, Math.floor(value.bestScore)),
      bestGrade: value.bestGrade ?? null,
      completedRuns: Math.max(0, Math.floor(value.completedRuns ?? 0)),
      tutorialSeen: Boolean(value.tutorialSeen),
      soundEnabled: Boolean(value.soundEnabled),
      reducedEffects: Boolean(value.reducedEffects),
    }
  } catch {
    return defaultSettings()
  }
}

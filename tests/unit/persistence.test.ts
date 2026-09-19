import { describe, expect, it } from 'vitest'
import { parseSettings } from '~/utils/persistence'

describe('settings persistence', () => {
  it('falls back safely for invalid JSON and schemas', () => {
    expect(parseSettings('{broken').bestScore).toBe(0)
    expect(parseSettings(JSON.stringify({ version: 99, bestScore: 9000 })).bestScore).toBe(0)
  })
  it('hydrates valid versioned settings', () => {
    const settings = parseSettings(JSON.stringify({ version: 1, bestScore: 3210, bestGrade: 'B', completedRuns: 2, tutorialSeen: true, soundEnabled: true, reducedEffects: false }))
    expect(settings.bestScore).toBe(3210)
    expect(settings.soundEnabled).toBe(true)
  })
})

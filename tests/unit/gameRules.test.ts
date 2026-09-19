import { describe, expect, it } from 'vitest'
import { actionPoints, focusProgressMultiplier, gradeForScore, loadProgressMultiplier, reorientationDuration } from '~/utils/gameRules'

describe('game rules', () => {
  it('scores optimal, acceptable, and wrong triage actions', () => {
    expect(actionPoints('ignore', 'ignore')).toBe(100)
    expect(actionPoints('snooze', 'ignore')).toBe(35)
    expect(actionPoints('open', 'ignore')).toBe(-80)
  })
  it('applies focus and cognitive-load progress thresholds', () => {
    expect(focusProgressMultiplier(75)).toBe(1)
    expect(focusProgressMultiplier(49)).toBe(.8)
    expect(focusProgressMultiplier(24)).toBe(.55)
    expect(loadProgressMultiplier(84)).toBe(1)
    expect(loadProgressMultiplier(85)).toBe(.75)
  })
  it('maps complexity to reorientation duration', () => {
    expect(reorientationDuration('low')).toBe(2)
    expect(reorientationDuration('normal')).toBe(4)
    expect(reorientationDuration('high')).toBe(7)
  })
  it('uses exact grade thresholds and forces catastrophic F', () => {
    expect(gradeForScore(3900)).toBe('S')
    expect(gradeForScore(3300)).toBe('A')
    expect(gradeForScore(2700)).toBe('B')
    expect(gradeForScore(2100)).toBe('C')
    expect(gradeForScore(1400)).toBe('D')
    expect(gradeForScore(1399)).toBe('F')
    expect(gradeForScore(5000, true)).toBe('F')
  })
})

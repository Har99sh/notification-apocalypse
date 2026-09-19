import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { notificationById } from '~/data/notifications'
import { createSchedule, useGameStore } from '~/stores/game'

describe('game store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('builds deterministic seeded schedules', () => {
    expect(createSchedule(42).map(x => x.dueAt)).toEqual(createSchedule(42).map(x => x.dueAt))
    expect(createSchedule(42).map(x => x.dueAt)).not.toEqual(createSchedule(43).map(x => x.dueAt))
  })

  it('accumulates and caps cognitive load', () => {
    const game = useGameStore(); game.startGame()
    const item = notificationById('checkout-spike')!
    game.enqueue(item); game.cognitiveLoad = 99.9; game.tick(1)
    expect(game.cognitiveLoad).toBe(100)
  })

  it('returns a snoozed notification exactly once', () => {
    const game = useGameStore(); game.startGame(); game.scheduled = []
    const item = notificationById('package')!
    game.enqueue(item)
    game.choose(game.visible[0]!.instanceId, 'snooze')
    expect(game.scheduled).toHaveLength(1)
    for (let i = 0; i < 25; i++) game.tick(1)
    expect(game.visible[0]?.snoozed).toBe(true)
    game.choose(game.visible[0]!.instanceId, 'snooze')
    expect(game.scheduled).toHaveLength(0)
  })

  it('triggers an urgent consequence after expiry', () => {
    const game = useGameStore(); game.startGame(); game.scheduled = []
    game.enqueue(notificationById('unknown-login')!)
    for (let i = 0; i < 25; i++) game.tick(1)
    expect(game.emergenciesMissed).toBe(1)
    expect(game.focus).toBe(82)
  })

  it('supports success, timeout, focus, and catastrophic endings', () => {
    const success = useGameStore(); success.startGame(); success.reportProgress = 99.99; success.scheduled = []; success.tick(1)
    expect(success.result?.success).toBe(true)
    setActivePinia(createPinia()); const timeout = useGameStore(); timeout.startGame(); timeout.scheduled = []; timeout.elapsed = 179.5; timeout.reorientationRemaining = 10; timeout.tick(1)
    expect(timeout.result?.failureReason).toBe('timeout')
    setActivePinia(createPinia()); const burnout = useGameStore(); burnout.startGame(); burnout.scheduled = []; burnout.focus = .1; burnout.enqueue(notificationById('reaction')!); burnout.choose(burnout.visible[0]!.instanceId, 'open')
    burnout.tick(.1); expect(burnout.result?.failureReason).toBe('burnout')
    setActivePinia(createPinia()); const incident = useGameStore(); incident.startGame(); incident.applyConsequence(notificationById('rollback')!, true)
    expect(incident.result?.failureReason).toBe('incident'); expect(incident.result?.grade).toBe('F')
  })
})

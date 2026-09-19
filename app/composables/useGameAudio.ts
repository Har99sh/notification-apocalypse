import { useGameStore } from '~/stores/game'

export function useGameAudio() {
  const game = useGameStore()
  let context: AudioContext | null = null
  let lastPing = 0

  const tone = (frequency: number, duration = 0.08, volume = 0.035, type: OscillatorType = 'sine') => {
    if (!game.settings.soundEnabled || !import.meta.client) return
    context ??= new AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration)
  }

  watch(() => game.visible.length, (length, oldLength) => {
    if (length <= oldLength || Date.now() - lastPing < 250) return
    lastPing = Date.now()
    const newest = game.visible.at(-1)
    tone(newest?.category === 'urgent' ? 740 : 520 + Math.random() * 30, newest?.category === 'urgent' ? 0.14 : 0.08, 0.035, newest?.category === 'urgent' ? 'square' : 'sine')
  })
  watch(() => game.phase, (phase) => {
    if (phase === 'result') {
      const success = game.result?.success
      tone(success ? 523 : 180, 0.3, 0.05, success ? 'sine' : 'sawtooth')
      if (success) setTimeout(() => tone(659, 0.35, 0.04), 120)
    }
  })
  return { tone }
}

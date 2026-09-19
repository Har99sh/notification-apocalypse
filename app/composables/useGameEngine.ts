import { useGameStore } from '~/stores/game'

export function useGameEngine() {
  const game = useGameStore()
  let frame = 0
  let previous = 0

  const loop = (now: number) => {
    if (!previous) previous = now
    const delta = Math.min((now - previous) / 1000, 0.25)
    previous = now
    game.tick(delta)
    frame = requestAnimationFrame(loop)
  }

  const onVisibility = () => {
    if (document.hidden) game.pause()
    previous = performance.now()
  }

  onMounted(() => {
    previous = performance.now()
    frame = requestAnimationFrame(loop)
    document.addEventListener('visibilitychange', onVisibility)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    document.removeEventListener('visibilitychange', onVisibility)
  })
}

<script setup lang="ts">
import { useGameStore } from '~/stores/game'
const game = useGameStore()
const dialog = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
const actions = computed(() => game.opened?.detailActions ?? [{ label: 'Close', result: 'neutral' as const }])
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); game.closeDetail(); return }
  if (event.key !== 'Tab' || !dialog.value) return
  const controls = [...dialog.value.querySelectorAll<HTMLElement>('button')]
  const first = controls[0]; const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
onMounted(() => {
  previousFocus = document.activeElement as HTMLElement
  document.addEventListener('keydown', keydown)
  nextTick(() => dialog.value?.querySelector<HTMLElement>('button')?.focus())
})
onBeforeUnmount(() => { document.removeEventListener('keydown', keydown); previousFocus?.focus() })
</script>

<template>
  <div v-if="game.opened" class="detail-backdrop" @click.self="game.closeDetail">
    <section ref="dialog" class="detail-sheet" role="dialog" aria-modal="true" :aria-labelledby="`detail-${game.opened.id}`">
      <div class="detail-grabber" />
      <div class="detail-app"><span class="app-icon" :class="`app-${game.opened.icon}`"><UiAppIcon :name="game.opened.icon" /></span><div><small>{{ game.opened.app }}</small><strong>{{ game.opened.sender ?? 'Notification detail' }}</strong></div></div>
      <p class="eyebrow">OPENED · WORK PAUSED</p>
      <h2 :id="`detail-${game.opened.id}`">{{ game.opened.detailTitle ?? game.opened.title }}</h2>
      <p>{{ game.opened.detailBody ?? game.opened.body }}</p>
      <div class="detail-actions">
        <button v-for="action in actions" :key="action.label" type="button" :class="{ primary: action.result === 'correct' }" @click="game.resolveDetail(action.result)">{{ action.label }}</button>
      </div>
      <small class="escape-hint">Esc closes · closing still costs refocus time</small>
    </section>
  </div>
</template>

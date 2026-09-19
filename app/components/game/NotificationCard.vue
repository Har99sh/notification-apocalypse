<script setup lang="ts">
import type { ActiveNotification, OptimalAction } from '~/types/game'
const props = defineProps<{ item: ActiveNotification; index: number; reducedEffects: boolean }>()
const emit = defineEmits<{ choose: [id: string, action: OptimalAction] }>()
const start = reactive({ x: 0, y: 0 })
const delta = reactive({ x: 0, y: 0 })
const dragging = ref(false)
const age = computed(() => props.item.snoozed ? 'BACK' : 'NOW')
const transform = computed(() => props.reducedEffects || !dragging.value ? undefined : `translate(${delta.x}px, ${Math.max(0, delta.y)}px) rotate(${delta.x / 30}deg)`)
function down(event: PointerEvent) { start.x = event.clientX; start.y = event.clientY; dragging.value = true; (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId) }
function move(event: PointerEvent) { if (dragging.value) { delta.x = event.clientX - start.x; delta.y = event.clientY - start.y } }
function up() {
  if (!dragging.value) return
  dragging.value = false
  if (Math.abs(delta.x) > 70 && Math.abs(delta.x) > Math.abs(delta.y)) emit('choose', props.item.instanceId, delta.x > 0 ? 'open' : 'ignore')
  else if (delta.y > 65) emit('choose', props.item.instanceId, 'snooze')
  delta.x = 0; delta.y = 0
}
</script>

<template>
  <article class="notification-card" :class="{ pip: item.chainId === 'pip' }" :style="{ '--stack': index, '--pip-step': item.chainStep ?? 0, transform }" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
    <div class="notification-head">
      <span class="app-icon" :class="`app-${item.icon}`"><UiAppIcon :name="item.icon" /><span class="sr-only">{{ item.app }} icon</span></span>
      <div><strong>{{ item.app }}</strong><small v-if="item.sender">{{ item.sender }}</small></div>
      <time>{{ age }}</time>
    </div>
    <h2>{{ item.title }}</h2>
    <p>{{ item.body }}</p>
    <div class="notification-actions">
      <button type="button" aria-keyshortcuts="1" @pointerdown.stop @click="emit('choose', item.instanceId, 'ignore')"><kbd>1</kbd> Ignore</button>
      <button type="button" aria-keyshortcuts="2" @pointerdown.stop @click="emit('choose', item.instanceId, 'snooze')"><kbd>2</kbd> Snooze</button>
      <button type="button" class="open" aria-keyshortcuts="3" @pointerdown.stop @click="emit('choose', item.instanceId, 'open')"><kbd>3</kbd> Open</button>
    </div>
  </article>
</template>

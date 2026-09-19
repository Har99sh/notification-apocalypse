<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <svg class="app-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
    <path v-if="name === 'mail' || name === 'box'" d="M3 6h18v12H3zM3 7l9 6 9-6" />
    <path v-else-if="name === 'chat'" d="M4 4h16v12H9l-5 4V4zM8 9h8M8 12h5" />
    <path v-else-if="name === 'calendar'" d="M4 5h16v15H4zM8 3v4M16 3v4M4 9h16" />
    <path v-else-if="name === 'shield'" d="M12 3l8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3zM9 12l2 2 4-5" />
    <path v-else-if="name === 'rocket'" d="M14 4c3-2 6-1 6-1s1 3-1 6l-6 6-4-4 5-7zM8 12l-3 1-2 3 5-1M12 16l-1 5 3-2 1-3M8 18l-2 2" />
    <path v-else-if="name === 'lynx'" d="M5 8L3 3l6 3h6l6-3-2 5v7c-2 4-5 6-7 6s-5-2-7-6V8zM8 12h.01M16 12h.01M10 16h4" />
    <path v-else-if="name === 'cloud'" d="M7 18h11a4 4 0 0 0 0-8h-1a6 6 0 0 0-11-1 4.5 4.5 0 0 0 1 9z" />
    <path v-else-if="name === 'bug'" d="M8 9h8v8a4 4 0 0 1-8 0V9zM9 9a3 3 0 0 1 6 0M4 12h4M16 12h4M5 18l3-2M19 18l-3-2M10 5L8 3M14 5l2-2" />
    <path v-else-if="name === 'food'" d="M5 3v7a3 3 0 0 0 3 3V3M5 7h6M8 13v8M16 3v18M16 3c4 2 4 8 0 10" />
    <path v-else-if="name === 'person'" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
    <path v-else-if="name === 'photo'" d="M3 5h18v14H3zM7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 17l5-5 3 3 3-3 7 6" />
    <path v-else-if="name === 'pulse'" d="M3 12h4l2-6 4 12 2-6h6" />
    <path v-else d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
</template>

<template>
  <div class="rounded-3xl border border-white/70 bg-white/70 p-4 mb-6 shadow-inner">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-2 w-2 rounded-full animate-pulse" :class="statusClass"></div>
        <span class="text-sm font-medium text-slate-900">{{ statusText }}</span>
      </div>
      <div class="text-right">
        <p class="text-sm font-semibold text-slate-900">
          {{ turnText }}
        </p>
        <p class="text-xs text-slate-500">{{ gameMode }} • {{ formatGameTime(gameTime) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  connectionStatus: string
  isMyTurn: boolean
  gameMode: string
  gameTime: number
}

const props = defineProps<Props>()

const statusClass = computed(() => {
  if (props.connectionStatus === 'Connected') return 'bg-green-500'
  if (props.connectionStatus === 'Loading...') return 'bg-blue-500'
  return 'bg-yellow-500'
})

const statusText = computed(() => props.connectionStatus)

const turnText = computed(() => {
  return props.isMyTurn ? 'Your turn' : 'Opponent\'s turn'
})

const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

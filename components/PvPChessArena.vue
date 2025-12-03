<template>
  <div class="space-y-6">
    <!-- Tournament Game Banner -->
    <div class="rounded-3xl border border-white/70 bg-gradient-to-r from-[#021d94]/10 to-[#ffaa00]/10 p-4 shadow-inner">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="text-2xl">🏆</div>
          <div>
            <p class="text-sm font-semibold text-slate-900">Tournament Match</p>
            <p class="text-xs text-slate-600">Playing as {{ playerColor === 'white' ? 'White' : 'Black' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-2 w-2 rounded-full animate-pulse" :class="connectionStatusClass"></div>
          <span class="text-sm font-medium text-slate-700">{{ connectionStatus }}</span>
        </div>
      </div>
    </div>

    <!-- Use the existing PollingChessGame component if matchId is provided -->
    <PollingChessGame 
      v-if="matchId"
      :game-id="matchId"
      @game-end="handleGameEnd"
    />

    <!-- Fallback for missing match ID -->
    <div v-else class="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
      <h3 class="text-lg font-semibold text-red-900">Match Not Found</h3>
      <p class="mt-2 text-sm text-red-700">No match ID was provided. Please return to the tournament lobby.</p>
      <NuxtLink 
        to="/battle-royale" 
        class="mt-4 inline-block rounded-full bg-red-100 px-6 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 transition-colors"
      >
        Back to Tournament
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PollingChessGame from '~/components/PollingChessGame.vue'

interface OpponentInfo {
  id: string
  name: string
  rating?: number
}

const props = defineProps<{
  matchId: string
  playerColor: 'white' | 'black'
  opponent?: OpponentInfo
}>()

const emit = defineEmits<{
  (e: 'game-end', result: 'win' | 'loss' | 'draw'): void
}>()

// Connection status (can be enhanced to track actual connection state)
const connectionStatus = ref('Connected')
const connectionStatusClass = computed(() => {
  if (connectionStatus.value === 'Connected') return 'bg-green-500'
  if (connectionStatus.value === 'Reconnecting...') return 'bg-yellow-500'
  return 'bg-red-500'
})

// Handle game end event from PollingChessGame
const handleGameEnd = (gameEndInfo: any) => {
  console.log('[PvPChessArena] Game ended:', gameEndInfo)
  
  // Determine result from the game end info
  let result: 'win' | 'loss' | 'draw' = 'draw'
  
  if (gameEndInfo) {
    if (gameEndInfo.isDraw) {
      result = 'draw'
    } else if (gameEndInfo.isVictory) {
      result = 'win'
    } else {
      result = 'loss'
    }
  }
  
  emit('game-end', result)
}
</script>

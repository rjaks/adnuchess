<template>
  <div class="fixed top-0 right-0 bg-white/90 p-4 rounded-bl-lg shadow-lg border border-gray-200 z-50 max-w-sm overflow-auto max-h-screen">
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-sm font-bold">Chess Debug Panel</h3>
      <button @click="isOpen = !isOpen" class="text-xs bg-gray-200 px-2 py-1 rounded">
        {{ isOpen ? 'Hide' : 'Show' }}
      </button>
    </div>
    
    <div v-if="isOpen" class="space-y-2 text-xs">
      <div class="p-2 bg-gray-100 rounded border-l-4" :class="isMyTurn ? 'border-green-500' : 'border-red-500'">
        <p><span class="font-semibold">Game ID:</span> {{ gameId }}</p>
        <p><span class="font-semibold">Current User:</span> {{ user?.name || 'Not logged in' }} ({{ user?.id || 'Unknown' }})</p>
        <p><span class="font-semibold">My Color:</span> <span :class="{'font-bold': true, 'text-amber-600': myColor === 'white', 'text-slate-800': myColor === 'black'}">{{ myColor }}</span></p>
        <p><span class="font-semibold">Current Turn:</span> <span :class="{'font-bold': true, 'text-amber-600': gameState?.currentTurn === 'white', 'text-slate-800': gameState?.currentTurn === 'black'}">{{ gameState?.currentTurn || 'Unknown' }}</span></p>
        <p><span class="font-semibold">Is My Turn:</span> <span :class="isMyTurn ? 'text-green-600 font-bold' : 'text-red-600'">{{ isMyTurn ? 'Yes' : 'No' }}</span></p>
        <p><span class="font-semibold">Last Update:</span> {{ lastUpdateTime }}</p>
      </div>
      
      <div class="grid grid-cols-2 gap-2">
        <div class="p-2 bg-gray-100 rounded" :class="{'bg-amber-50': gameState?.player1?.color === 'white'}">
          <p class="font-semibold">Player 1 (White):</p>
          <p>ID: {{ gameState?.player1?.id || 'Unknown' }}</p>
          <p>Name: {{ gameState?.player1?.name || 'Unknown' }}</p>
          <p class="font-bold">Color: {{ gameState?.player1?.color || 'Unknown' }}</p>
          <p>Am I this player: {{ user?.id === gameState?.player1?.id ? 'Yes' : 'No' }}</p>
        </div>
        
        <div class="p-2 bg-gray-100 rounded" :class="{'bg-slate-50': gameState?.player2?.color === 'black'}">
          <p class="font-semibold">Player 2 (Black):</p>
          <p>ID: {{ gameState?.player2?.id || 'Unknown' }}</p>
          <p>Name: {{ gameState?.player2?.name || 'Unknown' }}</p>
          <p class="font-bold">Color: {{ gameState?.player2?.color || 'Unknown' }}</p>
          <p>Am I this player: {{ user?.id === gameState?.player2?.id ? 'Yes' : 'No' }}</p>
        </div>
      </div>
      
      <div class="p-2 bg-gray-100 rounded">
        <p class="font-semibold">Game State:</p>
        <p>Status: <span :class="{'font-bold': true, 'text-green-600': gameState?.status === 'active', 'text-amber-600': gameState?.status === 'waiting', 'text-red-600': gameState?.status === 'finished'}">{{ gameState?.status || 'Unknown' }}</span></p>
        <p class="truncate"><span class="font-semibold">FEN:</span> <span class="font-mono text-[8px]">{{ gameState?.fen || 'Unknown' }}</span></p>
        <p><span class="font-semibold">Last Move:</span> {{ gameState?.lastMove || 'None' }}</p>
        <p><span class="font-semibold">Last Move Time:</span> {{ gameState?.lastMoveTime ? new Date(gameState.lastMoveTime).toLocaleTimeString() : 'Unknown' }}</p>
        <p><span class="font-semibold">Total Moves:</span> {{ gameState?.moveHistory?.length || 0 }}</p>
      </div>
      
      <div class="grid grid-cols-2 gap-2 mt-2">
        <button @click="forceRefresh" class="bg-blue-500 text-white py-1 px-2 rounded text-xs">
          Force Refresh
        </button>
        <button @click="logState" class="bg-green-500 text-white py-1 px-2 rounded text-xs">
          Log State to Console
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'

const props = defineProps<{
  gameId: string
  gameState: any
  myColor: string
  isMyTurn: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { user } = useAuth()
const isOpen = ref(false)
const lastUpdate = ref(Date.now())

// Update timestamp whenever gameState changes
watch(() => props.gameState, () => {
  lastUpdate.value = Date.now()
}, { deep: true })

const lastUpdateTime = computed(() => {
  return new Date(lastUpdate.value).toLocaleTimeString()
})

const forceRefresh = () => {
  emit('refresh')
}

const logState = () => {
  console.group('Chess Game State Debug')
  console.log('Game ID:', props.gameId)
  console.log('Game State:', props.gameState)
  console.log('My Color:', props.myColor)
  console.log('Is My Turn:', props.isMyTurn)
  console.log('Current User:', user.value)
  
  if (props.gameState) {
    console.log('Current Turn:', props.gameState.currentTurn)
    console.log('Status:', props.gameState.status)
    console.log('FEN:', props.gameState.fen)
    console.log('Move History:', props.gameState.moveHistory)
    console.log('Player 1:', props.gameState.player1)
    console.log('Player 2:', props.gameState.player2)
  }
  
  console.groupEnd()
}
</script>

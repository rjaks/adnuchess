<template>
  <div class="space-y-8">
    <header class="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Tournament Match</p>
      <div class="mt-2 flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-600">{{ player1Name }} vs {{ player2Name }}</p>
          <p v-if="tournamentId" class="text-xs text-slate-500 mt-1">Match ID: {{ gameId }}</p>
        </div>
        <NuxtLink :to="`/battle-royale`" class="text-sm text-[#021d94] hover:underline">
          ← Back to Tournament
        </NuxtLink>
      </div>
    </header>

    <!-- Waiting Lobby -->
    <div v-if="!gameStarted" class="rounded-3xl border border-white/70 bg-white/70 p-12 shadow-glass backdrop-blur-xl text-center">
      <h2 class="text-2xl font-bold text-slate-900 mb-8">Match Lobby</h2>
      
      <div class="grid grid-cols-2 gap-8 max-w-2xl mx-auto mb-8">
        <!-- Player 1 -->
        <div class="rounded-2xl border-2 p-6" :class="player1Ready ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'">
          <div class="text-4xl mb-3">♟️</div>
          <p class="font-bold text-slate-900">{{ player1Name }}</p>
          <p class="text-sm text-slate-600 mt-1">White Pieces</p>
          <div class="mt-4">
            <span v-if="player1Ready" class="inline-flex items-center gap-2 text-green-600 font-semibold">
              <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Ready!
            </span>
            <span v-else class="text-slate-400">Waiting...</span>
          </div>
        </div>

        <!-- Player 2 -->
        <div class="rounded-2xl border-2 p-6" :class="player2Ready ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'">
          <div class="text-4xl mb-3">♟️</div>
          <p class="font-bold text-slate-900">{{ player2Name }}</p>
          <p class="text-sm text-slate-600 mt-1">Black Pieces</p>
          <div class="mt-4">
            <span v-if="player2Ready" class="inline-flex items-center gap-2 text-green-600 font-semibold">
              <span class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Ready!
            </span>
            <span v-else class="text-slate-400">Waiting...</span>
          </div>
        </div>
      </div>

      <!-- Ready Button -->
      <button
        v-if="isPlayer && !isPlayerReady"
        @click="setReady"
        class="px-8 py-4 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white font-bold text-lg hover:shadow-lg hover:shadow-[#021d94]/25 transition-all duration-300"
      >
        I'm Ready!
      </button>

      <div v-else-if="isPlayer && isPlayerReady" class="text-green-600 font-semibold">
        ✓ You are ready. Waiting for opponent...
      </div>

      <div v-else class="text-slate-500">
        Spectating this match
      </div>

      <!-- Starting countdown -->
      <div v-if="bothPlayersReady && countdown > 0" class="mt-8">
        <p class="text-3xl font-bold text-[#021d94] animate-pulse">
          Starting in {{ countdown }}...
        </p>
      </div>
    </div>

    <!-- Chess Game -->
    <div v-else-if="playerColor">
      <PvPChessArena 
        :match-id="gameId"
        :player-color="playerColor"
        :opponent="opponentInfo"
        @game-end="handleGameEnd"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import PvPChessArena from '~/components/PvPChessArena.vue'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()

const gameId = ref(route.query.gameId as string || '')
const player1 = ref(route.query.player1 as string || '')
const player2 = ref(route.query.player2 as string || '')
const tournamentId = ref(route.query.tournament as string || '')

const player1Name = ref('Player 1')
const player2Name = ref('Player 2')
const playerColor = ref<'white' | 'black' | null>(null)

const player1Ready = ref(false)
const player2Ready = ref(false)
const gameStarted = ref(false)
const countdown = ref(3)

let pollInterval: NodeJS.Timeout | null = null
let countdownInterval: NodeJS.Timeout | null = null

const LOBBY_KEY = `match_lobby_${gameId.value}`

const isPlayer = computed(() => {
  return user.value && (user.value.id === player1.value || user.value.id === player2.value)
})

const isPlayerReady = computed(() => {
  if (!user.value) return false
  if (user.value.id === player1.value) return player1Ready.value
  if (user.value.id === player2.value) return player2Ready.value
  return false
})

const bothPlayersReady = computed(() => {
  return player1Ready.value && player2Ready.value
})

const opponentInfo = computed(() => {
  if (!user.value) return undefined
  
  const isPlayer1 = user.value.id === player1.value
  const opponentId = isPlayer1 ? player2.value : player1.value
  const opponentName = isPlayer1 ? player2Name.value : player1Name.value
  
  return {
    id: opponentId,
    name: opponentName,
    rating: 1200
  }
})

const loadLobbyState = () => {
  if (typeof window === 'undefined') return
  const data = localStorage.getItem(LOBBY_KEY)
  if (data) {
    const state = JSON.parse(data)
    player1Ready.value = state.player1Ready || false
    player2Ready.value = state.player2Ready || false
    gameStarted.value = state.gameStarted || false
  }
}

const saveLobbyState = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOBBY_KEY, JSON.stringify({
    player1Ready: player1Ready.value,
    player2Ready: player2Ready.value,
    gameStarted: gameStarted.value
  }))
}

const setReady = () => {
  if (!user.value) {
    console.log('setReady: No user found')
    return
  }
  
  console.log('setReady called:', {
    userId: user.value.id,
    player1: player1.value,
    player2: player2.value
  })
  
  if (user.value.id === player1.value) {
    player1Ready.value = true
    console.log('Player 1 is now ready')
  } else if (user.value.id === player2.value) {
    player2Ready.value = true
    console.log('Player 2 is now ready')
  }
  
  saveLobbyState()
  console.log('Lobby state saved:', {
    player1Ready: player1Ready.value,
    player2Ready: player2Ready.value,
    lobbyKey: LOBBY_KEY
  })
  
  // Check if both ready
  if (bothPlayersReady.value) {
    console.log('Both players ready! Starting countdown...')
    startCountdown()
  }
}

const startCountdown = () => {
  countdown.value = 3
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownInterval) clearInterval(countdownInterval)
      gameStarted.value = true
      saveLobbyState()
    }
  }, 1000)
}

onMounted(async () => {
  // Get player names - handle both email format and numeric IDs
  player1Name.value = player1.value.includes('@') 
    ? player1.value.split('@')[0] 
    : `Player ${player1.value.slice(-4)}`
  player2Name.value = player2.value.includes('@') 
    ? player2.value.split('@')[0] 
    : `Player ${player2.value.slice(-4)}`
  
  // Determine player color
  if (user.value) {
    if (user.value.id === player1.value) {
      playerColor.value = 'white'
    } else if (user.value.id === player2.value) {
      playerColor.value = 'black'
    } else {
      playerColor.value = 'white' // Spectator
    }
  }
  
  console.log('Tournament Game Mounted:', {
    gameId: gameId.value,
    lobbyKey: LOBBY_KEY,
    player1: player1.value,
    player2: player2.value,
    currentUser: user.value?.id,
    isPlayer: isPlayer.value
  })
  
  // Load lobby state
  loadLobbyState()
  
  console.log('Loaded lobby state:', {
    player1Ready: player1Ready.value,
    player2Ready: player2Ready.value,
    gameStarted: gameStarted.value
  })
  
  // If both already ready, start countdown
  if (bothPlayersReady.value && !gameStarted.value) {
    startCountdown()
  }
  
  // Poll for lobby updates every second
  pollInterval = setInterval(() => {
    loadLobbyState()
    if (bothPlayersReady.value && !gameStarted.value && !countdownInterval) {
      startCountdown()
    }
  }, 1000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (countdownInterval) clearInterval(countdownInterval)
})

const handleGameEnd = async (result: 'win' | 'loss' | 'draw') => {
  console.log('Game ended:', result)
  
  // Clear lobby state
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOBBY_KEY)
  }
  
  // TODO: Update tournament match result
  
  // Navigate back to tournament
  router.push('/battle-royale')
}
</script>

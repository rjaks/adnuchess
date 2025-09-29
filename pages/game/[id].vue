<template>
  <div class="space-y-8">
    <header class="rounded-4xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Player vs Player</p>
          <h1 class="mt-3 text-3xl font-bold text-slate-900">Live Match</h1>
        </div>
        <div class="text-right">
          <p class="text-sm text-slate-600">Game Mode: {{ gameMode }}</p>
          <p class="text-xs text-slate-500">Match ID: {{ matchId }}</p>
        </div>
      </div>
    </header>

    <!-- Game Loading -->
    <div v-if="!gameLoaded" class="text-center py-12">
      <div class="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-6 py-3 shadow-lg">
        <div class="h-4 w-4 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></div>
        <span class="font-medium text-[#021d94]">Loading match...</span>
      </div>
    </div>

    <!-- Game Error -->
    <div v-else-if="gameError" class="text-center py-12">
      <div class="rounded-3xl border border-red-200 bg-red-50 p-6 max-w-md mx-auto">
        <h3 class="text-lg font-semibold text-red-900">Unable to Load Match</h3>
        <p class="mt-2 text-sm text-red-700">{{ gameError }}</p>
        <button
          @click="navigateTo('/matchmaking')"
          class="mt-4 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
        >
          Back to Matchmaking
        </button>
      </div>
    </div>

    <!-- Active Game -->
    <div v-else class="grid gap-6 lg:grid-cols-[1fr,300px]">
      <!-- Chess Board -->
      <div class="rounded-4xl border border-white/70 bg-white/60 p-6 shadow-glass backdrop-blur-xl">
        <!-- Player Info -->
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-[#021d94]/10 flex items-center justify-center">
              <span class="text-sm font-bold text-[#021d94]">{{ opponentInitials }}</span>
            </div>
            <div>
              <p class="font-semibold text-slate-900">{{ opponent?.name || 'Opponent' }}</p>
              <p class="text-xs text-slate-500">Rating: {{ opponent?.rating || 1200 }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-slate-900">{{ playerColor === 'white' ? 'You' : 'Waiting...' }}</p>
            <p class="text-xs text-slate-500">{{ playerColor === 'white' ? 'White to move' : 'Black to move' }}</p>
          </div>
        </div>

        <!-- Chess Board Component -->
        <PvPChessArena 
          :match-id="matchId"
          :player-color="playerColor"
          :opponent="opponent"
          @game-end="handleGameEnd"
        />

        <div class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-[#ffaa00]/10 flex items-center justify-center">
              <span class="text-sm font-bold text-[#ffaa00]">{{ userInitials }}</span>
            </div>
            <div>
              <p class="font-semibold text-slate-900">{{ user?.name || 'You' }}</p>
              <p class="text-xs text-slate-500">Rating: {{ userRating }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-slate-900">{{ playerColor === 'black' ? 'You' : 'Waiting...' }}</p>
            <p class="text-xs text-slate-500">{{ playerColor === 'black' ? 'Black to move' : 'White to move' }}</p>
          </div>
        </div>
      </div>

      <!-- Game Info Sidebar -->
      <div class="space-y-6">
        <!-- Game Status -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h3 class="text-lg font-semibold text-slate-900">Game Status</h3>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-600">Turn</span>
              <span class="font-semibold">{{ currentTurn === playerColor ? 'Your turn' : 'Opponent' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Game Time</span>
              <span class="font-semibold">{{ formatGameTime(gameTime) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Moves</span>
              <span class="font-semibold">{{ moveCount }}</span>
            </div>
          </div>
        </div>

        <!-- Chat -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h3 class="text-lg font-semibold text-slate-900">Chat</h3>
          <div class="mt-4 h-32 overflow-y-auto rounded-xl bg-white/40 p-3">
            <div v-if="chatMessages.length === 0" class="text-center text-sm text-slate-500">
              No messages yet
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="message in chatMessages"
                :key="message.id"
                class="text-sm"
                :class="message.isOwn ? 'text-right' : 'text-left'"
              >
                <span class="font-medium">{{ message.sender }}:</span>
                <span class="ml-1">{{ message.text }}</span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Type a message..."
              class="flex-1 rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm focus:border-[#021d94]/60 focus:outline-none"
            >
            <button
              @click="sendMessage"
              class="rounded-lg bg-[#021d94] px-3 py-2 text-sm font-semibold text-white hover:bg-[#021d94]/90"
            >
              Send
            </button>
          </div>
        </div>

        <!-- Game Actions -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h3 class="text-lg font-semibold text-slate-900">Actions</h3>
          <div class="mt-4 space-y-3">
            <button
              @click="offerDraw"
              :disabled="drawOffered"
              class="w-full rounded-lg border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] hover:bg-white disabled:opacity-50"
            >
              {{ drawOffered ? 'Draw Offered' : 'Offer Draw' }}
            </button>
            <button
              @click="resign"
              class="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Resign
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useRoute, navigateTo } from '#imports'

type ChatMessage = {
  id: string
  sender: string
  text: string
  isOwn: boolean
}

type Opponent = {
  id: string
  name: string
  rating: number
}

const route = useRoute()
const { user } = useAuth()

const matchId = route.params.id as string
const gameLoaded = ref(false)
const gameError = ref('')
const playerColor = ref<'white' | 'black'>('white')
const opponent = ref<Opponent | null>(null)
const gameMode = ref('blitz')
const currentTurn = ref<'white' | 'black'>('white')
const gameTime = ref(0)
const moveCount = ref(0)
const chatMessages = ref<ChatMessage[]>([])
const newMessage = ref('')
const drawOffered = ref(false)

let gameTimer: ReturnType<typeof setInterval> | null = null

const userRating = computed(() => {
  if (!user.value) return 1200
  return 1200 + (user.value.stats.wins * 25) - (user.value.stats.losses * 20)
})

const userInitials = computed(() => {
  if (!user.value) return 'You'
  const name = user.value.name || user.value.email
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const opponentInitials = computed(() => {
  if (!opponent.value) return 'OP'
  return opponent.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const loadMatch = async () => {
  try {
    // Load match details from server
    const response = await $fetch<{
      match: {
        id: string
        gameMode: string
        player1: Opponent
        player2: Opponent
        currentTurn: 'white' | 'black'
      }
      playerColor: 'white' | 'black'
    }>(`/api/game/${matchId}`)
    
    gameMode.value = response.match.gameMode
    playerColor.value = response.playerColor
    currentTurn.value = response.match.currentTurn
    
    // Set opponent based on player color
    opponent.value = playerColor.value === 'white' 
      ? response.match.player2 
      : response.match.player1
    
    gameLoaded.value = true
    startGameTimer()
  } catch (error) {
    console.error('Failed to load match:', error)
    gameError.value = 'Match not found or has expired'
  }
}

const startGameTimer = () => {
  gameTimer = setInterval(() => {
    gameTime.value += 1
  }, 1000)
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const message: ChatMessage = {
    id: Date.now().toString(),
    sender: user.value?.name || 'You',
    text: newMessage.value,
    isOwn: true
  }
  
  chatMessages.value.push(message)
  newMessage.value = ''
  
  // TODO: Send message via WebSocket to opponent
}

const offerDraw = () => {
  drawOffered.value = true
  // TODO: Send draw offer via WebSocket
}

const resign = () => {
  if (confirm('Are you sure you want to resign?')) {
    // TODO: Send resignation via WebSocket
    navigateTo('/matchmaking')
  }
}

const handleGameEnd = (result: 'win' | 'loss' | 'draw') => {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
  
  // TODO: Handle game end logic
  console.log('Game ended:', result)
}

onMounted(() => {
  loadMatch()
})

onBeforeUnmount(() => {
  if (gameTimer) {
    clearInterval(gameTimer)
  }
})
</script>
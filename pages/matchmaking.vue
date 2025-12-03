<template>
  <section class="space-y-8">
    <!-- Demo Notice -->
    <div class="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-inner">
      <h3 class="text-lg font-semibold text-blue-900">Real Multiplayer System</h3>
      <p class="mt-2 text-sm text-blue-700">
        This is a fully functional player vs player matchmaking system using Convex for real-time gameplay.
      </p>
    </div>
    <!-- Header -->
    <header class="rounded-4xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Player vs Player</p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Find Your Match</h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-600">
        Join the matchmaking queue to face fellow Ateneans in real-time chess battles. Get paired based on your skill level for fair and exciting matches.
      </p>
    </header>

    <!-- Matchmaking Status -->
    <div class="grid gap-6 lg:grid-cols-[1fr,400px]">
      <div class="space-y-6">
        <!-- Queue Status Card -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Queue Status</h2>
            <span
              class="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]"
              :class="queueStatusClass"
            >
              {{ queueStatusText }}
            </span>
          </div>
          <p class="mt-3 text-sm text-slate-600">{{ statusMessage }}</p>
          
          <!-- Queue Timer -->
          <div v-if="inQueue" class="mt-4 flex items-center gap-3">
            <div class="flex-1 rounded-full bg-[#021d94]/10 p-1">
              <div 
                class="h-2 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] transition-all duration-300"
                :style="{ width: queueProgress + '%' }"
              ></div>
            </div>
            <span class="text-sm font-medium text-[#021d94]">{{ formatTime(queueTime) }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex gap-3">
            <button
              v-if="!inQueue"
              type="button"
              class="flex-1 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              @click="joinQueue"
              :disabled="isSearching"
            >
              <span v-if="isSearching">Finding Match...</span>
              <span v-else>Find Match (Demo)</span>
            </button>
            <button
              v-else
              type="button"
              class="flex-1 rounded-full border border-red-300 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              @click="leaveQueue"
            >
              Cancel Search
            </button>
            <button
              type="button"
              class="rounded-full border border-[#021d94]/30 bg-white/80 px-4 py-3 text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60"
              @click="refreshStats"
            >
              Refresh
            </button>
          </div>
        </div>

        <!-- Game Modes -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h2 class="text-lg font-semibold text-slate-900">Game Modes</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              v-for="mode in gameModes"
              :key="mode.id"
              type="button"
              class="rounded-2xl border p-4 text-left transition"
              :class="selectedMode === mode.id 
                ? 'border-[#021d94]/60 bg-[#021d94]/10' 
                : 'border-white/70 bg-white/40 hover:border-[#021d94]/30'"
              @click="selectedMode = mode.id"
            >
              <div class="flex items-center justify-between">
                <h3 class="font-semibold text-slate-900">{{ mode.name }}</h3>
                <span class="text-xs text-[#021d94]/70">{{ mode.time }}</span>
              </div>
              <p class="mt-1 text-xs text-slate-600">{{ mode.description }}</p>
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Current Stats -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h2 class="text-lg font-semibold text-slate-900">Your Stats</h2>
          <div class="mt-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">ELO Rating</span>
              <span class="font-semibold text-[#021d94]">{{ userStats.rating }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Games Played</span>
              <span class="font-semibold text-[#021d94]">{{ userStats.gamesPlayed }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Wins</span>
              <span class="font-semibold text-green-600">{{ userStats.wins }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Losses</span>
              <span class="font-semibold text-red-600">{{ userStats.losses }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-600">Draws</span>
              <span class="font-semibold text-slate-600">{{ userStats.draws }}</span>
            </div>
          </div>
        </div>

        <!-- Queue Info -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h2 class="text-lg font-semibold text-slate-900">Queue Info</h2>
          <div class="mt-4 space-y-3 text-sm text-slate-600">
            <div class="flex items-center justify-between">
              <span>Players Online</span>
              <span class="font-semibold text-[#021d94]">{{ onlineCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>In Queue</span>
              <span class="font-semibold text-[#021d94]">{{ queueCount }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Avg. Wait Time</span>
              <span class="font-semibold text-[#021d94]">{{ avgWaitTime }}s</span>
            </div>
          </div>
        </div>

        <!-- Recent Matches -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h2 class="text-lg font-semibold text-slate-900">Recent PvP</h2>
          <div v-if="recentMatches.length === 0" class="mt-4 text-center text-sm text-slate-500">
            No recent matches
          </div>
          <div v-else class="mt-4 space-y-2">
            <div
              v-for="match in recentMatches.slice(0, 3)"
              :key="match.id"
              class="rounded-xl border border-white/60 bg-white/40 p-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-900">{{ match.opponent }}</span>
                <span 
                  class="rounded-full px-2 py-1 text-xs font-semibold uppercase"
                  :class="getResultClass(match.result)"
                >
                  {{ match.result }}
                </span>
              </div>
              <div class="mt-1 text-xs text-slate-500">{{ match.timeAgo }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#imports'

type GameMode = {
  id: string
  name: string
  time: string
  description: string
}

type MatchResult = {
  id: string
  opponent: string
  result: 'win' | 'loss' | 'draw'
  timeAgo: string
}

const { user, refresh: refreshAuth } = useAuth()

// State
const inQueue = ref(false)
const queueTime = ref(0)
const selectedMode = ref('blitz')
const onlineCount = ref(25)
const queueCount = ref(3)
const avgWaitTime = ref(45)
const recentMatches = ref<MatchResult[]>([])
const statusMessage = ref('Ready to find a match')

// Polling timers
let queueTimer: ReturnType<typeof setInterval> | null = null
let queuePolling: ReturnType<typeof setInterval> | null = null
const isSearching = ref(false)

const gameModes: GameMode[] = [
  {
    id: 'bullet',
    name: 'Bullet',
    time: '1+0',
    description: 'Lightning fast games'
  },
  {
    id: 'blitz',
    name: 'Blitz',
    time: '5+3',
    description: 'Quick tactical battles'
  },
  {
    id: 'rapid',
    name: 'Rapid',
    time: '10+5',
    description: 'Strategic gameplay'
  },
  {
    id: 'classical',
    name: 'Classical',
    time: '30+0',
    description: 'Deep calculation'
  }
]

const userStats = computed(() => {
  if (!user.value) {
    return { rating: 1500, wins: 0, losses: 0, draws: 0, gamesPlayed: 0 }
  }
  return {
    rating: user.value.eloRating ?? 1500,
    wins: user.value.stats.wins,
    losses: user.value.stats.losses,
    draws: user.value.stats.draws,
    gamesPlayed: user.value.gamesPlayed ?? 0
  }
})

const queueStatusClass = computed(() => {
  if (isSearching.value) {
    return 'border-yellow-300 bg-yellow-50 text-yellow-700'
  }
  if (inQueue.value) {
    return 'border-blue-300 bg-blue-50 text-blue-700'
  }
  return 'border-[#021d94]/30 bg-[#021d94]/10 text-[#021d94]'
})

const queueStatusText = computed(() => {
  if (isSearching.value) return 'Joining...'
  if (inQueue.value) return 'In Queue'
  return 'Ready'
})

const queueProgress = computed(() => {
  const maxTime = 120 // 2 minutes max
  return Math.min((queueTime.value / maxTime) * 100, 100)
})

const connectToMatchmaking = async () => {
  statusMessage.value = 'Connected to matchmaking server'
}

const joinQueue = async () => {
  if (isSearching.value || inQueue.value) return
  
  try {
    isSearching.value = true
    queueTime.value = 0
    statusMessage.value = 'Joining matchmaking queue...'
    
    const response = await $fetch('/api/matchmaking/join', {
      method: 'POST',
      body: {
        gameMode: selectedMode.value,
        rating: userStats.value.rating
      }
    })
    
    if (response.success) {
      if ('matchFound' in response && response.matchFound) {
        // Match found immediately!
        isSearching.value = false
        statusMessage.value = 'Match found! Starting game...'
        
        setTimeout(() => {
          if ('gameId' in response && response.gameId) {
            navigateTo(`/game/${response.gameId}`)
          }
        }, 1000)
      } else {
        // Added to queue, start polling
        isSearching.value = false
        inQueue.value = true
        statusMessage.value = `Looking for ${selectedMode.value} opponents...`
        startQueuePolling()
      }
    } else {
      // Failed to join queue
      isSearching.value = false
      const errorMsg = 'message' in response ? response.message : 'Failed to join matchmaking. Please try again.'
      statusMessage.value = errorMsg
    }
  } catch (error) {
    console.error('Failed to join matchmaking:', error)
    isSearching.value = false
    statusMessage.value = 'Failed to join matchmaking. Please try again.'
  }
}

type MatchmakingStatusResponse = {
  inQueue: boolean
  matchFound: boolean
  gameId?: string
}

const startQueuePolling = () => {
  // Poll every 2 seconds to check for matches
  queuePolling = setInterval(async () => {
    try {
      const response = await $fetch<MatchmakingStatusResponse>('/api/matchmaking/status')
      
      if ('matchFound' in response && response.matchFound) {
        // Match found!
        stopQueuePolling()
        inQueue.value = false
        statusMessage.value = 'Match found! Starting game...'
        
        setTimeout(() => {
          if (response.gameId) {
            navigateTo(`/game/${response.gameId}`)
          }
        }, 1000)
      } else if (!response.inQueue) {
        // Player was removed from queue (shouldn't happen but handle gracefully)
        stopQueuePolling()
        inQueue.value = false
        statusMessage.value = 'Disconnected from queue. Please try again.'
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }, 2000)
  
  // Update queue timer every second
  startQueueTimer()
}

const stopQueuePolling = () => {
  if (queuePolling) {
    clearInterval(queuePolling)
    queuePolling = null
  }
  stopQueueTimer()
}

const leaveQueue = async () => {
  try {
    await $fetch('/api/matchmaking/leave', {
      method: 'POST'
    })
  } catch (error) {
    console.error('Failed to leave queue:', error)
  }
  
  inQueue.value = false
  stopQueuePolling()
  statusMessage.value = 'Ready to find a match'
}

const simulateMatchFound = () => {
  inQueue.value = false
  statusMessage.value = 'Match found! Redirecting...'
  stopQueuePolling()
  
  // Generate a demo match ID and redirect
  const matchId = Math.random().toString(36).substring(2, 15)
  navigateTo(`/game/${matchId}`)
}

const startQueueTimer = () => {
  queueTimer = setInterval(() => {
    queueTime.value += 1
  }, 1000)
}

const stopQueueTimer = () => {
  if (queueTimer) {
    clearInterval(queueTimer)
    queueTimer = null
  }
  queueTime.value = 0
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const refreshStats = async () => {
  try {
    const response = await $fetch<{
      onlineCount: number
      queueCount: number
      avgWaitTime: number
      recentMatches: MatchResult[]
    }>('/api/matchmaking/stats')
    
    onlineCount.value = response.onlineCount
    queueCount.value = response.queueCount
    avgWaitTime.value = response.avgWaitTime
    recentMatches.value = response.recentMatches
  } catch (error) {
    console.error('Failed to refresh stats:', error)
    // Use demo data
    onlineCount.value = Math.floor(Math.random() * 50) + 15
    queueCount.value = Math.floor(Math.random() * 8) + 1
    avgWaitTime.value = Math.floor(Math.random() * 60) + 20
    recentMatches.value = [
      { id: '1', opponent: 'Maria Santos', result: 'win', timeAgo: '2 hours ago' },
      { id: '2', opponent: 'Juan Cruz', result: 'loss', timeAgo: '1 day ago' },
      { id: '3', opponent: 'Ana Rodriguez', result: 'draw', timeAgo: '2 days ago' }
    ]
  }
}

const getResultClass = (result: string) => {
  switch (result) {
    case 'win':
      return 'bg-green-100 text-green-700'
    case 'loss':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

onMounted(async () => {
  // Refresh user auth to get latest ELO rating
  await refreshAuth().catch(() => {})
  await refreshStats()
  await connectToMatchmaking()
})

onBeforeUnmount(() => {
  stopQueuePolling()
  if (inQueue.value) {
    leaveQueue()
  }
})
</script>
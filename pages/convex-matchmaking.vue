<template>
  <section class="space-y-8">
    <!-- Demo Notice -->
    <div class="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-inner">
      <h3 class="text-lg font-semibold text-green-900">Real-Time Multiplayer System</h3>
      <p class="mt-2 text-sm text-green-700">
        This is a fully functional player vs player matchmaking system using Convex real-time database for instant gameplay.
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

          <div class="mt-4 space-y-4">
            <!-- Status Message -->
            <p class="text-sm text-slate-600">{{ statusMessage }}</p>

            <!-- Queue Timer -->
            <div v-if="inQueue" class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Queue time</span>
                <span class="font-semibold">{{ formatTime(queueTime) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full bg-[#021d94] transition-all duration-1000"
                  :style="{ width: `${queueProgress}%` }"
                ></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button
                v-if="!inQueue && !isSearching"
                @click="joinQueue"
                :disabled="!selectedMode"
                class="rounded-lg bg-[#021d94] px-4 py-2 text-sm font-semibold text-white hover:bg-[#021d94]/90 disabled:opacity-50"
              >
                Find Match
              </button>
              
              <button
                v-if="inQueue"
                @click="leaveQueue"
                class="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Leave Queue
              </button>
              
              <button
                v-if="isSearching"
                disabled
                class="rounded-lg bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700"
              >
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 animate-spin rounded-full border border-yellow-700 border-t-transparent"></div>
                  Searching...
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Game Mode Selection -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h2 class="text-lg font-semibold text-slate-900">Game Mode</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="mode in gameModes"
              :key="mode.id"
              @click="selectedMode = mode.id"
              :class="[
                'cursor-pointer rounded-xl border p-4 transition-all',
                selectedMode === mode.id
                  ? 'border-[#021d94] bg-[#021d94]/10 ring-2 ring-[#021d94]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-slate-900">{{ mode.name }}</h3>
                  <p class="text-sm text-slate-600">{{ mode.time }}</p>
                </div>
                <div class="text-xs text-slate-500">{{ mode.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Panel -->
      <div class="space-y-6">
        <!-- Player Stats -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <h2 class="text-lg font-semibold text-slate-900">Your Stats</h2>
          <div class="mt-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-600">Rating</span>
              <span class="font-bold text-[#021d94]">{{ userStats.rating }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Wins</span>
              <span class="font-semibold text-green-600">{{ userStats.wins }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Losses</span>
              <span class="font-semibold text-red-600">{{ userStats.losses }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Draws</span>
              <span class="font-semibold text-slate-600">{{ userStats.draws }}</span>
            </div>
          </div>
        </div>

        <!-- Queue Stats -->
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Queue Info</h2>
            <button
              @click="refreshStats"
              class="text-xs text-slate-500 hover:text-slate-700"
            >
              Refresh
            </button>
          </div>
          <div class="mt-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-600">Players Online</span>
              <span class="font-semibold">{{ queueStats?.onlineCount || 0 }}</span>
            </div>
            <div v-if="queueStats?.gameModes" class="space-y-2">
              <div v-for="(count, mode) in queueStats.gameModes" :key="mode" class="flex justify-between text-sm">
                <span class="text-slate-500 capitalize">{{ mode }}</span>
                <span class="font-medium">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#imports'
import { api } from '~/convex/_generated/api'

type GameMode = {
  id: string
  name: string
  time: string
  description: string
}

type QueueStats = {
  onlineCount: number
  gameModes: Record<string, number>
}

const { user } = useAuth()
const { $convex } = useNuxtApp()

// Reactive state
const selectedMode = ref('blitz')
const inQueue = ref(false)
const queueTime = ref(0)
const isSearching = ref(false)
const statusMessage = ref('Ready to find a match')
const queueStats = ref<QueueStats | null>(null)

// Timers
let queueTimer: ReturnType<typeof setInterval> | null = null

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
    return { rating: 1200, wins: 0, losses: 0, draws: 0 }
  }
  return {
    rating: 1200,
    wins: 0,
    losses: 0,
    draws: 0
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

// Real-time queue status watching
const queueStatusQuery = computed(() => {
  if (!$convex || !user.value) return null
  return $convex.query(api.matchmaking.getQueueStatus, { userId: user.value.id })
})

watch(queueStatusQuery, (status) => {
  if (!status) return
  
  if (status.matchFound) {
    // Match found! Redirect to game
    inQueue.value = false
    statusMessage.value = 'Match found! Starting game...'
    stopQueueTimer()
    
    setTimeout(() => {
      navigateTo(`/game/${status.gameId}`)
    }, 1000)
  } else if (status.inQueue) {
    // Player is in queue
    if (!inQueue.value) {
      inQueue.value = true
      statusMessage.value = `Looking for ${status.gameMode} opponents...`
      startQueueTimer()
    }
  } else {
    // Player is not in queue
    inQueue.value = false
    isSearching.value = false
    statusMessage.value = 'Ready to find a match'
    stopQueueTimer()
  }
}, { immediate: true })

// Queue methods
const joinQueue = async () => {
  if (!user.value || isSearching.value || inQueue.value) return
  
  try {
    isSearching.value = true
    statusMessage.value = 'Joining matchmaking queue...'
    
    const response = await $convex.mutation(api.matchmaking.joinQueue, {
      userId: user.value.id,
      userName: user.value.name,
      userRating: userStats.value.rating,
      gameMode: selectedMode.value
    })
    
    if (response.success) {
      if (response.matchFound) {
        // Match found immediately!
        isSearching.value = false
        statusMessage.value = 'Match found! Starting game...'
        
        setTimeout(() => {
          navigateTo(`/game/${response.gameId}`)
        }, 1000)
      } else {
        // Added to queue
        isSearching.value = false
        inQueue.value = true
        statusMessage.value = `Looking for ${selectedMode.value} opponents...`
        startQueueTimer()
      }
    }
  } catch (error) {
    console.error('Failed to join matchmaking:', error)
    isSearching.value = false
    statusMessage.value = 'Failed to join matchmaking. Please try again.'
  }
}

const leaveQueue = async () => {
  if (!user.value) return
  
  try {
    await $convex.mutation(api.matchmaking.leaveQueue, {
      userId: user.value.id
    })
  } catch (error) {
    console.error('Failed to leave queue:', error)
  }
  
  inQueue.value = false
  stopQueueTimer()
  statusMessage.value = 'Ready to find a match'
}

const refreshStats = async () => {
  try {
    const stats = await $convex.query(api.matchmaking.getQueueStats, {})
    queueStats.value = stats
  } catch (error) {
    console.error('Failed to refresh stats:', error)
  }
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

onMounted(() => {
  refreshStats()
})

onBeforeUnmount(() => {
  stopQueueTimer()
})
</script>
<template>
  <div class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-glass backdrop-blur-xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-slate-900">Match History</h2>
      <span 
        v-if="matchHistory && matchHistory.length > 0"
        class="rounded-full bg-[#021d94]/10 px-3 py-1 text-xs font-semibold text-[#021d94]"
      >
        {{ matchHistory.length }} {{ matchHistory.length === 1 ? 'Game' : 'Games' }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></div>
        <span class="text-slate-600">Loading match history...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!matchHistory || matchHistory.length === 0" class="text-center py-12">
      <div class="text-4xl mb-3">♟️</div>
      <p class="text-slate-600">No completed games yet</p>
      <p class="text-sm text-slate-400 mt-1">Games will appear here once finished</p>
    </div>

    <!-- Match History Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-200">
            <th class="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Result</th>
            <th class="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Opponent</th>
            <th class="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</th>
            <th class="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
            <th class="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr 
            v-for="match in matchHistory" 
            :key="match.gameId"
            class="hover:bg-slate-50/50 transition-colors"
          >
            <!-- Result -->
            <td class="py-4 pr-4">
              <span 
                class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                :class="resultClass(match.result)"
              >
                <span class="text-sm">{{ resultIcon(match.result) }}</span>
                {{ match.result }}
              </span>
            </td>

            <!-- Opponent Name (Link to Profile) -->
            <td class="py-4 pr-4">
              <NuxtLink 
                :to="`/profile/${match.opponentId}`"
                class="font-medium text-slate-900 hover:text-[#021d94] transition-colors"
              >
                {{ match.opponentName }}
              </NuxtLink>
            </td>

            <!-- Opponent Rating -->
            <td class="py-4 text-center">
              <span class="text-sm font-medium text-slate-600">
                {{ match.opponentRating }}
              </span>
            </td>

            <!-- Date Played -->
            <td class="py-4 text-center">
              <span class="text-sm text-slate-500">
                {{ formatDate(match.datePlayed) }}
              </span>
            </td>

            <!-- Actions -->
            <td class="py-4 text-right">
              <NuxtLink 
                :to="`/game/${match.gameId}?analyze=true`"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#021d94]/10 text-[#021d94] hover:bg-[#021d94]/20 transition-colors text-xs font-semibold"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analyze
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps<{
  targetUserId: string
}>()

// Types
type MatchHistoryItem = {
  gameId: string
  opponentName: string
  opponentId: string
  opponentRating: number
  result: 'Win' | 'Loss' | 'Draw'
  datePlayed: number
}

// State
const matchHistory = ref<MatchHistoryItem[] | null>(null)
const loading = ref(true)

// Fetch match history using $fetch (Nuxt's built-in fetch)
const fetchMatchHistory = async () => {
  if (!props.targetUserId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const response = await $fetch<{ matches: MatchHistoryItem[] }>(`/api/players/${props.targetUserId}/matches`)
    matchHistory.value = response.matches
  } catch (error) {
    console.error('Failed to fetch match history:', error)
    matchHistory.value = []
  } finally {
    loading.value = false
  }
}

// Watch for targetUserId changes
watch(() => props.targetUserId, () => {
  fetchMatchHistory()
}, { immediate: true })

// Utility functions
const resultClass = (result: string) => {
  switch (result) {
    case 'Win':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'Loss':
      return 'bg-red-100 text-red-700 border border-red-200'
    case 'Draw':
      return 'bg-gray-100 text-gray-600 border border-gray-200'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

const resultIcon = (result: string) => {
  switch (result) {
    case 'Win':
      return '✓'
    case 'Loss':
      return '✗'
    case 'Draw':
      return '='
    default:
      return '?'
  }
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // If less than 24 hours ago, show relative time
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`
    }
    return `${diffHours}h ago`
  }

  // If less than 7 days ago, show days
  if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`
  }

  // Otherwise show formatted date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

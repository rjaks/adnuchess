<template>
  <div class="mx-auto max-w-6xl px-4 py-16 space-y-8">
    <!-- Header -->
    <header class="text-center space-y-4">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Campus Rankings</p>
      <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Leaderboard</h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
        See how you stack up against fellow AdNU chess players. Rankings update in real-time based on match results.
      </p>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glass backdrop-blur-xl text-center">
        <div class="text-2xl font-bold text-[#021d94]">{{ totalPlayers }}</div>
        <div class="text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 mt-1">Active Players</div>
      </div>
      <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glass backdrop-blur-xl text-center">
        <div class="text-2xl font-bold text-[#ffaa00]">{{ totalMatches }}</div>
        <div class="text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 mt-1">Total Matches</div>
      </div>
      <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glass backdrop-blur-xl text-center">
        <div class="text-2xl font-bold text-emerald-600">{{ activeToday }}</div>
        <div class="text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 mt-1">Active Today</div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="rounded-4xl border border-white/70 bg-white/60 p-8 shadow-glass backdrop-blur-xl">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-semibold text-slate-900">Top Players</h2>
        <div class="flex items-center gap-3">
          <!-- Filter Toggle Button -->
          <button 
            @click="toggleFilters"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2',
              showFilters 
                ? 'bg-[#021d94] text-white shadow-lg' 
                : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/30'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
            </svg>
            Filters
          </button>
          
          <!-- Time Period Filters -->
          <div class="flex gap-2">
            <button 
              v-for="period in periods" 
              :key="period.value"
              @click="selectedPeriod = period.value"
              :class="[
                'px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] rounded-full transition-colors',
                selectedPeriod === period.value 
                  ? 'bg-[#021d94] text-white' 
                  : 'bg-white/60 text-slate-600 hover:bg-white/80'
              ]"
            >
              {{ period.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Advanced Filters Panel -->
      <transition 
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showFilters" class="mb-8 p-6 rounded-3xl bg-white/40 border border-white/50">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900">Filter Options</h3>
            <button 
              @click="clearFilters"
              class="text-sm text-slate-500 hover:text-slate-700 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- College Filter -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-3">College</label>
              <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                <button
                  v-for="college in collegesWithCounts"
                  :key="college.value"
                  @click="selectedCollege = college.value"
                  :class="[
                    'p-2 text-left text-xs rounded-lg transition-colors border',
                    selectedCollege === college.value
                      ? 'bg-[#021d94] text-white border-[#021d94]'
                      : 'bg-white/60 text-slate-600 border-white/30 hover:bg-white/80'
                  ]"
                >
                  <div class="font-medium truncate">{{ college.label }}</div>
                  <div class="text-xs opacity-70">{{ college.count || 0 }} players</div>
                </button>
              </div>
            </div>

            <!-- User Type Filter -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-3">User Type</label>
              <div class="space-y-2">
                <button
                  v-for="type in userTypesWithCounts"
                  :key="type.value"
                  @click="selectedUserType = type.value"
                  :class="[
                    'w-full p-3 text-left rounded-lg transition-colors border flex items-center justify-between',
                    selectedUserType === type.value
                      ? 'bg-[#021d94] text-white border-[#021d94]'
                      : 'bg-white/60 text-slate-600 border-white/30 hover:bg-white/80'
                  ]"
                >
                  <div>
                    <div class="font-medium">{{ type.label }}</div>
                    <div class="text-xs opacity-70">{{ type.count || 0 }} players</div>
                  </div>
                  <div v-if="type.value === 'student'" class="text-2xl">🎓</div>
                  <div v-else-if="type.value === 'faculty'" class="text-2xl">👨‍🏫</div>
                  <div v-else-if="type.value === 'staff'" class="text-2xl">👩‍💼</div>
                  <div v-else-if="type.value === 'alumni'" class="text-2xl">👨‍🎓</div>
                  <div v-else class="text-2xl">👥</div>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Active Filters Display -->
          <div v-if="selectedCollege !== 'all' || selectedUserType !== 'all'" class="mt-4 pt-4 border-t border-white/20">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm text-slate-600">Active filters:</span>
              <span 
                v-if="selectedCollege !== 'all'"
                class="inline-flex items-center gap-1 px-2 py-1 bg-[#021d94]/10 text-[#021d94] text-xs rounded-full"
              >
                {{ colleges.find(c => c.value === selectedCollege)?.label }}
                <button @click="selectedCollege = 'all'" class="hover:bg-[#021d94]/20 rounded-full p-0.5">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </span>
              <span 
                v-if="selectedUserType !== 'all'"
                class="inline-flex items-center gap-1 px-2 py-1 bg-[#ffaa00]/10 text-[#b87400] text-xs rounded-full"
              >
                {{ userTypes.find(t => t.value === selectedUserType)?.label }}
                <button @click="selectedUserType = 'all'" class="hover:bg-[#ffaa00]/20 rounded-full p-0.5">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </span>
            </div>
          </div>
        </div>
      </transition>

      <!-- Top 3 Podium -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          v-for="(player, index) in topThree" 
          :key="player.id"
          @click="navigateToProfile(player.id)"
          :class="[
            'rounded-3xl border p-6 text-center relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 group',
            index === 0 ? 'border-yellow-300/50 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200' :
            index === 1 ? 'border-gray-300/50 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200' :
            'border-amber-300/50 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200'
          ]"
        >
          <!-- Trophy Icon -->
          <div class="text-4xl mb-3">
            {{ index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉' }}
          </div>
          
          <!-- Profile Picture -->
          <div class="mx-auto w-16 h-16 rounded-full bg-slate-200 mb-3 flex items-center justify-center overflow-hidden">
            <img 
              v-if="player.picture" 
              :src="player.picture" 
              :alt="player.name"
              class="w-full h-full object-cover"
            >
            <span v-else class="text-lg font-semibold text-slate-600">{{ player.name.charAt(0) }}</span>
          </div>
          
          <!-- Player Info -->
          <h3 class="font-bold text-slate-900 mb-1 hover:text-[#021d94] transition-colors group-hover:underline">{{ player.name }}</h3>
          <div class="flex items-center justify-center gap-1 mb-1">
            <p class="text-xs text-slate-500 uppercase tracking-wide">{{ player.department }}</p>
          </div>
          <div class="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view profile
          </div>
          <div class="flex items-center justify-center gap-1 mb-3">              <span 
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  player.userType === 'student' ? 'bg-blue-100 text-blue-800' :
                  player.userType === 'faculty' ? 'bg-purple-100 text-purple-800' :
                  player.userType === 'alumni' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                ]"
              >
                <span v-if="player.userType === 'student'">🎓</span>
                <span v-else-if="player.userType === 'faculty'">👨‍🏫</span>
                <span v-else-if="player.userType === 'alumni'">👨‍🎓</span>
                <span v-else>👩‍💼</span>
                {{ player.userType === 'student' ? 'Student' : 
                   player.userType === 'faculty' ? 'Faculty' : 
                   player.userType === 'alumni' ? 'Alumni' : 'Staff' }}
            </span>
            <span v-if="player.yearLevel && player.userType === 'student'" class="text-xs text-slate-400">
              • {{ player.yearLevel }}
            </span>
          </div>
          
          <!-- Stats -->
          <div class="space-y-2">
            <div class="flex justify-center items-center gap-2">
              <span class="text-lg font-bold text-emerald-600">{{ player.rating }}</span>
              <span class="text-xs text-slate-500">ELO</span>
            </div>
            <div class="flex justify-center gap-4 text-xs text-slate-600">
              <span>{{ player.stats.wins }}W</span>
              <span>{{ player.stats.losses }}L</span>
              <span>{{ player.stats.draws }}D</span>
            </div>
            <div class="text-xs text-slate-500">{{ player.winRate }}% win rate</div>
          </div>
        </div>
      </div>

      <!-- Full Rankings Table -->
      <div class="overflow-hidden rounded-2xl border border-white/30">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-white/30">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Rank</th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Player</th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Rating</th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Matches</th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Win Rate</th>
              <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">Streak</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/20">
            <tr 
              v-for="(player, index) in rankedPlayers" 
              :key="player.id"
              @click="navigateToProfile(player.id)"
              class="hover:bg-white/30 transition-colors cursor-pointer group"
              title="Click to view profile"
            >
              <!-- Rank -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span 
                    :class="[
                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                      index < 3 ? 'bg-[#021d94] text-white' : 'bg-slate-200 text-slate-600'
                    ]"
                  >
                    {{ index + 1 }}
                  </span>
                </div>
              </td>
              
              <!-- Player -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-slate-200 mr-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img 
                      v-if="player.picture" 
                      :src="player.picture" 
                      :alt="player.name"
                      class="w-full h-full object-cover"
                    >
                    <span v-else class="text-sm font-semibold text-slate-600">{{ player.name.charAt(0) }}</span>
                  </div>
                  <div>
                    <div class="font-semibold text-slate-900 hover:text-[#021d94] transition-colors flex items-center gap-1">
                      {{ player.name }}
                      <svg class="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <div class="text-xs text-slate-500 uppercase tracking-wide">{{ player.department }}</div>
                      <span 
                        :class="[
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                          player.userType === 'student' ? 'bg-blue-100 text-blue-800' :
                          player.userType === 'faculty' ? 'bg-purple-100 text-purple-800' :
                          player.userType === 'alumni' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        ]"
                      >
                        <span v-if="player.userType === 'student'">🎓</span>
                        <span v-else-if="player.userType === 'faculty'">👨‍🏫</span>
                        <span v-else-if="player.userType === 'alumni'">👨‍🎓</span>
                        <span v-else>👩‍💼</span>
                        {{ player.userType === 'student' ? 'Student' : 
                           player.userType === 'faculty' ? 'Faculty' : 
                           player.userType === 'alumni' ? 'Alumni' : 'Staff' }}
                      </span>
                      <span v-if="player.yearLevel && player.userType === 'student'" class="text-xs text-slate-400">
                        {{ player.yearLevel }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              
              <!-- Rating -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="text-lg font-bold text-emerald-600">{{ player.rating }}</span>
                <div 
                  :class="[
                    'text-xs font-semibold',
                    player.ratingChange > 0 ? 'text-emerald-600' : 
                    player.ratingChange < 0 ? 'text-red-500' : 'text-slate-500'
                  ]"
                >
                  {{ player.ratingChange > 0 ? '+' : '' }}{{ player.ratingChange || '' }}
                </div>
              </td>
              
              <!-- Matches -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <div class="text-sm font-semibold text-slate-900">{{ player.totalMatches }}</div>
                <div class="text-xs text-slate-500">
                  {{ player.stats.wins }}W-{{ player.stats.losses }}L-{{ player.stats.draws }}D
                </div>
              </td>
              
              <!-- Win Rate -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="text-sm font-semibold text-slate-900">{{ player.winRate }}%</span>
              </td>
              
              <!-- Streak -->
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    player.streak > 0 ? 'bg-emerald-100 text-emerald-800' :
                    player.streak < 0 ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  ]"
                >
                  {{ player.streak > 0 ? '+' : '' }}{{ player.streak }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Loading State -->
      <div class="text-center py-10" v-if="loading">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#021d94]"></div>
        <p class="mt-2 text-sm text-slate-600">Loading leaderboard data...</p>
      </div>

      <!-- No Players Message -->
      <div class="text-center py-10" v-if="!loading && filteredPlayers.length === 0">
        <p class="text-lg text-slate-600">No players found matching your filters.</p>
        <button 
          @click="clearFilters"
          class="mt-4 px-4 py-2 bg-[#021d94] text-white rounded-lg text-sm"
        >
          Clear Filters
        </button>
      </div>
      
      <!-- Load More -->
      <div class="text-center mt-6" v-if="canLoadMore">
        <button 
          @click="loadMore"
          class="px-6 py-2 rounded-full border border-[#021d94]/30 bg-white/80 text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60 hover:bg-white"
        >
          Load More Players
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Types
interface LeaderboardPlayer {
  id: string
  name: string
  email: string
  picture?: string
  department: string
  userType: 'student' | 'staff' | 'faculty' | 'alumni'
  yearLevel?: string
  rating: number
  ratingChange: number
  stats: {
    wins: number
    losses: number
    draws: number
  }
  streak: number
  lastActive: string
  totalMatches?: number
  winRate?: number
}

interface Period {
  value: string
  label: string
}

interface FilterOption {
  value: string
  label: string
  count?: number
}

// Reactive data
const selectedPeriod = ref('all')
const selectedCollege = ref('all')
const selectedUserType = ref('all')
const showFilters = ref(false)
const players = ref<LeaderboardPlayer[]>([])
const allPlayers = ref<LeaderboardPlayer[]>([])
const loading = ref(true)
const canLoadMore = ref(false) // Set to false since we're loading all at once

// Constants
const periods: Period[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' }
]

const colleges: FilterOption[] = [
  { value: 'all', label: 'All Colleges' },
  { value: 'humanities-social-sciences', label: 'College of Humanities and Social Sciences' },
  { value: 'business-accountancy', label: 'College of Business and Accountancy' },
  { value: 'computer-studies', label: 'College of Computer Studies' },
  { value: 'education', label: 'College of Education' },
  { value: 'science-engineering-architecture', label: 'College of Science, Engineering, and Architecture' },
  { value: 'nursing', label: 'College of Nursing' },
  { value: 'law', label: 'College of Law' }
]

const userTypes: FilterOption[] = [
  { value: 'all', label: 'All Users' },
  { value: 'student', label: 'Students' },
  { value: 'staff', label: 'Staff' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'alumni', label: 'Alumni' }
]

// Methods

// Computed properties
const filteredPlayers = computed(() => {
  let filtered = [...allPlayers.value]
  
  // Filter by college
  if (selectedCollege.value !== 'all') {
    const collegeLabel = colleges.find(c => c.value === selectedCollege.value)?.label
    filtered = filtered.filter(player => player.department === collegeLabel)
  }
  
  // Filter by user type
  if (selectedUserType.value !== 'all') {
    filtered = filtered.filter(player => player.userType === selectedUserType.value)
  }
  
  return filtered.sort((a, b) => b.rating - a.rating)
})

const rankedPlayers = computed(() => {
  return filteredPlayers.value.slice(0, 20) // Show top 20
})

const topThree = computed(() => rankedPlayers.value.slice(0, 3))

const totalPlayers = computed(() => filteredPlayers.value.length)

const totalMatches = computed(() => {
  return filteredPlayers.value.reduce((sum, player) => {
    return sum + (player.totalMatches || 0)
  }, 0)
})

const activeToday = computed(() => {
  const today = new Date().toDateString()
  return filteredPlayers.value.filter(player => 
    new Date(player.lastActive).toDateString() === today
  ).length
})

// Update college counts
const collegesWithCounts = computed(() => {
  return colleges.map(college => {
    if (college.value === 'all') {
      return { ...college, count: allPlayers.value.length }
    }
    const count = allPlayers.value.filter(player => 
      player.department === college.label
    ).length
    return { ...college, count }
  })
})

// Update user type counts  
const userTypesWithCounts = computed(() => {
  return userTypes.map(type => {
    if (type.value === 'all') {
      return { ...type, count: allPlayers.value.length }
    }
    const count = allPlayers.value.filter(player => 
      player.userType === type.value
    ).length
    return { ...type, count }
  })
})

// Add computed win rate to players - removed unused computed

// Methods
const navigateToProfile = (playerId: string) => {
  navigateTo(`/profile/${playerId}`)
}

const loadLeaderboard = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ players: LeaderboardPlayer[]; totalPlayers: number }>('/api/leaderboard', {
      query: { period: selectedPeriod.value }
    })
    allPlayers.value = response.players
    players.value = response.players
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
    // Fallback to empty data on error
    allPlayers.value = []
    players.value = []
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  selectedCollege.value = 'all'
  selectedUserType.value = 'all'
  selectedPeriod.value = 'all'
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const loadMore = () => {
  // TODO: Implement pagination
  canLoadMore.value = false
}

// Lifecycle
onMounted(() => {
  loadLeaderboard()
})

// Watch period changes
watch(selectedPeriod, () => {
  loadLeaderboard()
})

// Watch filter changes (no need to reload data, just recompute)
watch([selectedCollege, selectedUserType], () => {
  // Filters are handled by computed properties
})

// SEO
useHead({
  title: 'Leaderboard - AdNU Chess',
  meta: [
    { name: 'description', content: 'See the top chess players at Ateneo de Naga University. Track rankings, win rates, and match statistics.' }
  ]
})
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center min-h-screen">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></div>
      <span class="text-slate-600">Loading profile...</span>
    </div>
  </div>

  <div v-else-if="error" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-red-600">Profile Not Found</h1>
      <p class="text-slate-600 mt-2">{{ error }}</p>
      <NuxtLink to="/" class="mt-4 inline-block bg-[#021d94] text-white px-4 py-2 rounded-lg hover:bg-[#021d94]/90">
        Back to Home
      </NuxtLink>
    </div>
  </div>

  <section v-else class="space-y-10">
    <header class="rounded-4xl border border-white/70 bg-white/80 p-8 shadow-glass backdrop-blur-xl">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <div class="relative">
            <span
              v-if="playerProfile?.picture"
              class="grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-inner"
            >
              <img :src="playerProfile.picture" :alt="playerProfile?.name" class="h-full w-full object-cover" />
            </span>
            <span
              v-else
              class="grid h-20 w-20 place-items-center rounded-3xl bg-[#021d94]/15 text-2xl font-bold uppercase text-[#021d94]"
            >
              {{ initials }}
            </span>
          </div>
          <div class="space-y-1">
            <!-- Header Tag -->
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">
              AdNU Player Profile
            </p>
            
            <!-- Main Name -->
            <h1 class="text-3xl font-bold text-slate-900">{{ playerProfile?.displayName || playerProfile?.name }}</h1>
            
            <!-- Email -->
            <p class="text-sm text-slate-500">{{ playerProfile?.email }}</p>
            
            <!-- Account name (only show if different from display name) -->
            <p v-if="playerProfile?.displayName && playerProfile.displayName !== playerProfile?.name" class="text-sm italic text-slate-400">
              {{ playerProfile?.name }}
            </p>

            <!-- Department -->
            <p v-if="playerProfile?.department" class="text-sm text-slate-600 font-medium">
              {{ playerProfile.department.toUpperCase() }}
            </p>
            
            <!-- ELO Rating -->
            <p class="text-sm text-[#021d94] font-semibold">ELO: {{ playerProfile?.rating || 1200 }}</p>

            <!-- Role Badges -->
            <div class="flex flex-wrap gap-2 pt-1">
              <span
                v-if="playerProfile?.userType"
                class="inline-block rounded-full bg-[#021d94] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
              >
                {{ getUserTypeLabel(playerProfile.userType) }}
              </span>
              <span
                v-if="playerProfile?.yearLevel"
                class="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700"
              >
                {{ playerProfile.yearLevel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Arena Record - Card Layout -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Games Card -->
          <div class="rounded-2xl bg-white border border-white/60 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-slate-900">{{ playerProfile?.totalMatches || 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-slate-500">Total Games</div>
            </div>
          </div>
          
          <!-- Wins Card -->
          <div class="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-700">{{ playerProfile?.stats?.wins || 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-green-600">Wins</div>
            </div>
          </div>
          
          <!-- Losses Card -->
          <div class="rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-red-700">{{ playerProfile?.stats?.losses || 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-red-600">Losses</div>
            </div>
          </div>
          
          <!-- Draws Card -->
          <div class="rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4 shadow-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-amber-700">{{ playerProfile?.stats?.draws || 0 }}</div>
              <div class="text-xs uppercase tracking-wide text-amber-600">Draws</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Performance Analytics Section -->
    <section class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-inner">
      <h2 class="text-lg font-semibold text-slate-900 mb-4">Performance Analytics</h2>
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Win Rate Chart -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6">
          <h3 class="text-sm font-semibold text-slate-700 mb-4">Win Rate Distribution</h3>
          <div class="flex items-center justify-center">
            <div class="relative w-32 h-32">
              <!-- SVG Circular Chart -->
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <!-- Background circle -->
                <circle cx="60" cy="60" r="50" stroke="#e5e7eb" stroke-width="10" fill="none" />
                <!-- Win rate arc -->
                <circle 
                  cx="60" cy="60" r="50" 
                  stroke="#22c55e" 
                  stroke-width="10" 
                  fill="none"
                  :stroke-dasharray="winRateArc + ' ' + (314 - winRateArc)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
                <!-- Loss rate arc -->
                <circle 
                  cx="60" cy="60" r="35" 
                  stroke="#ef4444" 
                  stroke-width="8" 
                  fill="none"
                  :stroke-dasharray="lossRateArc + ' ' + (220 - lossRateArc)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
                <!-- Draw rate arc -->
                <circle 
                  cx="60" cy="60" r="22" 
                  stroke="#f59e0b" 
                  stroke-width="6" 
                  fill="none"
                  :stroke-dasharray="drawRateArc + ' ' + (138 - drawRateArc)"
                  stroke-linecap="round"
                  class="transition-all duration-1000 ease-out"
                />
              </svg>
              <!-- Center text -->
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-lg font-bold text-slate-800">{{ winPercentage }}%</div>
                  <div class="text-xs text-slate-600">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
          <!-- Legend -->
          <div class="mt-4 space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Wins: {{ playerProfile?.stats?.wins || 0 }} ({{ winPercentage }}%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Losses: {{ playerProfile?.stats?.losses || 0 }} ({{ lossPercentage }}%)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Draws: {{ playerProfile?.stats?.draws || 0 }} ({{ drawPercentage }}%)</span>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="space-y-4">
          <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">ELO Progress</span>
              <span class="text-sm font-semibold text-blue-600">{{ playerProfile?.rating || 1200 }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: eloProgress + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>1000</span>
              <span>2000</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Activity Level</span>
              <span class="text-sm font-semibold text-green-600">{{ activityLevel }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: activityPercentage + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>Inactive</span>
              <span>Very Active</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4 border border-slate-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Performance</span>
              <span class="text-sm font-semibold" :class="performanceColor">{{ performanceLevel }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-1000 ease-out"
                :class="performanceBarClass"
                :style="{ width: Math.max(winPercentage, 10) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>Beginner</span>
              <span>Expert</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Back to Search Button -->
    <div class="text-center">
      <button 
        @click="$router.go(-1)"
        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white rounded-lg hover:shadow-lg transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type PlayerProfile = {
  id: string
  name: string
  email: string
  picture?: string
  rating: number
  department?: string
  userType?: 'student' | 'staff' | 'faculty' | 'alumni'
  yearLevel?: string
  displayName?: string
  stats: {
    wins: number
    losses: number
    draws: number
  }
  totalMatches: number
  winRate: number
}

const route = useRoute()
const playerId = route.params.id as string

const playerProfile = ref<PlayerProfile | null>(null)
const loading = ref(true)
const error = ref('')

const fetchPlayerProfile = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const response: any = await $fetch(`/api/players/${playerId}`)
    playerProfile.value = response
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load player profile'
    playerProfile.value = null
  } finally {
    loading.value = false
  }
}

const initials = computed(() => {
  if (!playerProfile.value) return 'AU'
  const source = playerProfile.value.name || playerProfile.value.email
  const parts = source.split(/[\s@._]+/).filter(Boolean)
  return (
    parts
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('') || 'AU'
  )
})

const getUserTypeLabel = (userType?: string) => {
  switch (userType) {
    case 'faculty':
      return 'Faculty'
    case 'staff':
      return 'Staff'
    case 'alumni':
      return 'Alumni'
    default:
      return 'Student'
  }
}

// Analytics computed properties
const winPercentage = computed(() => {
  const total = playerProfile.value?.totalMatches || 0
  if (total === 0) return 0
  return Math.round(((playerProfile.value?.stats?.wins || 0) / total) * 100)
})

const lossPercentage = computed(() => {
  const total = playerProfile.value?.totalMatches || 0
  if (total === 0) return 0
  return Math.round(((playerProfile.value?.stats?.losses || 0) / total) * 100)
})

const drawPercentage = computed(() => {
  const total = playerProfile.value?.totalMatches || 0
  if (total === 0) return 0
  return Math.round(((playerProfile.value?.stats?.draws || 0) / total) * 100)
})

// SVG arc calculations for circular chart
const winRateArc = computed(() => {
  return (winPercentage.value / 100) * 314 // 314 is circumference for r=50
})

const lossRateArc = computed(() => {
  return (lossPercentage.value / 100) * 220 // 220 is circumference for r=35
})

const drawRateArc = computed(() => {
  return (drawPercentage.value / 100) * 138 // 138 is circumference for r=22
})

const eloProgress = computed(() => {
  const elo = playerProfile.value?.rating || 1200
  // Map ELO 1000-2000 to 0-100%
  return Math.min(Math.max(((elo - 1000) / 1000) * 100, 0), 100)
})

const activityLevel = computed(() => {
  const total = playerProfile.value?.totalMatches || 0
  if (total === 0) return 'New Player'
  if (total < 5) return 'Beginner'
  if (total < 20) return 'Active'
  if (total < 50) return 'Regular'
  return 'Very Active'
})

const activityPercentage = computed(() => {
  const total = playerProfile.value?.totalMatches || 0
  return Math.min((total / 50) * 100, 100)
})

const performanceLevel = computed(() => {
  const winRate = winPercentage.value
  if (winRate >= 70) return 'Excellent'
  if (winRate >= 60) return 'Great'
  if (winRate >= 50) return 'Good'
  if (winRate >= 40) return 'Average'
  return 'Learning'
})

const performanceColor = computed(() => {
  const winRate = winPercentage.value
  if (winRate >= 70) return 'text-green-600'
  if (winRate >= 60) return 'text-blue-600'
  if (winRate >= 50) return 'text-yellow-600'
  if (winRate >= 40) return 'text-orange-600'
  return 'text-red-600'
})

const performanceBarClass = computed(() => {
  const winRate = winPercentage.value
  if (winRate >= 70) return 'bg-gradient-to-r from-green-400 to-green-600'
  if (winRate >= 60) return 'bg-gradient-to-r from-blue-400 to-blue-600'
  if (winRate >= 50) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
  if (winRate >= 40) return 'bg-gradient-to-r from-orange-400 to-orange-600'
  return 'bg-gradient-to-r from-red-400 to-red-600'
})

onMounted(() => {
  fetchPlayerProfile()
})

definePageMeta({
  title: 'Player Profile'
})
</script>
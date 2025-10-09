<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
    <div class="mx-auto max-w-7xl px-4">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Weekly Content Management</h1>
        <p class="mt-2 text-slate-600">Manage weekly puzzles, features, and recurring content</p>
      </div>

      <!-- Week Selector -->
      <div class="mb-8 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Current Week</h2>
            <p class="text-slate-600">{{ currentWeekDisplay }}</p>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
              @click="navigateWeek(-1)"
            >
              Previous Week
            </button>
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              @click="goToCurrentWeek"
            >
              Current Week
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
              @click="navigateWeek(1)"
            >
              Next Week
            </button>
          </div>
        </div>
      </div>

      <!-- Weekly Content Grid -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Weekly Puzzle -->
        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Weekly Puzzle</h3>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
              :class="weeklyPuzzle ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ weeklyPuzzle ? 'Set' : 'Not Set' }}
            </span>
          </div>

          <div v-if="weeklyPuzzle" class="space-y-4">
            <div>
              <h4 class="font-medium text-slate-900">{{ weeklyPuzzle.title }}</h4>
              <p class="text-sm text-slate-600">{{ weeklyPuzzle.description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-slate-500">
              <span>Difficulty: {{ weeklyPuzzle.difficulty }}</span>
              <span>•</span>
              <span>Theme: {{ weeklyPuzzle.theme }}</span>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                @click="editWeeklyPuzzle"
              >
                Edit
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                @click="removeWeeklyPuzzle"
              >
                Remove
              </button>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg class="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <p class="text-slate-600 mb-4">No weekly puzzle set for this week</p>
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              @click="setWeeklyPuzzle"
            >
              Set Weekly Puzzle
            </button>
          </div>
        </div>

        <!-- Weekly Feature -->
        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Weekly Feature</h3>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
              :class="weeklyFeature ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ weeklyFeature ? 'Set' : 'Not Set' }}
            </span>
          </div>

          <div v-if="weeklyFeature" class="space-y-4">
            <div>
              <h4 class="font-medium text-slate-900">{{ weeklyFeature.title }}</h4>
              <p class="text-sm text-slate-600">{{ weeklyFeature.description }}</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-slate-500">
              <span>Type: {{ weeklyFeature.type }}</span>
              <span v-if="weeklyFeature.targetAudience">•</span>
              <span v-if="weeklyFeature.targetAudience">For: {{ weeklyFeature.targetAudience }}</span>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                @click="editWeeklyFeature"
              >
                Edit
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                @click="removeWeeklyFeature"
              >
                Remove
              </button>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg class="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p class="text-slate-600 mb-4">No weekly feature set for this week</p>
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              @click="setWeeklyFeature"
            >
              Set Weekly Feature
            </button>
          </div>
        </div>

        <!-- Weekly Tournament -->
        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Weekly Tournament</h3>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
              :class="weeklyTournament ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ weeklyTournament ? 'Scheduled' : 'Not Scheduled' }}
            </span>
          </div>

          <div v-if="weeklyTournament" class="space-y-4">
            <div>
              <h4 class="font-medium text-slate-900">{{ weeklyTournament.name }}</h4>
              <p class="text-sm text-slate-600">{{ weeklyTournament.description }}</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-slate-700">Start Time:</span>
                <p class="text-slate-600">{{ formatDateTime(weeklyTournament.startTime) }}</p>
              </div>
              <div>
                <span class="font-medium text-slate-700">Format:</span>
                <p class="text-slate-600">{{ weeklyTournament.format }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                @click="editWeeklyTournament"
              >
                Edit
              </button>
              <button
                type="button"
                class="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                @click="cancelWeeklyTournament"
              >
                Cancel
              </button>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg class="h-8 w-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <p class="text-slate-600 mb-4">No tournament scheduled for this week</p>
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              @click="scheduleWeeklyTournament"
            >
              Schedule Tournament
            </button>
          </div>
        </div>

        <!-- Weekly Leaderboard Reset -->
        <div class="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">Leaderboard Management</h3>
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800"
            >
              Weekly Reset
            </span>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-slate-700">Next Reset:</span>
                <p class="text-slate-600">{{ nextLeaderboardReset }}</p>
              </div>
              <div>
                <span class="font-medium text-slate-700">Last Reset:</span>
                <p class="text-slate-600">{{ lastLeaderboardReset }}</p>
              </div>
            </div>
            
            <div class="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-amber-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-amber-800">Manual Reset Available</p>
                  <p class="text-xs text-amber-700 mt-1">You can manually reset the weekly leaderboard if needed</p>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                @click="viewLeaderboardHistory"
              >
                View History
              </button>
              <button
                type="button"
                class="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                @click="manualLeaderboardReset"
              >
                Manual Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <WeeklyPuzzleModal
      :is-open="showPuzzleModal"
      :puzzle="editingPuzzle"
      @close="closePuzzleModal"
      @save="saveWeeklyPuzzle"
    />

    <WeeklyFeatureModal
      :is-open="showFeatureModal"
      :feature="editingFeature"
      @close="closeFeatureModal"
      @save="saveWeeklyFeature"
    />

    <WeeklyTournamentModal
      :is-open="showTournamentModal"
      :tournament="editingTournament"
      @close="closeTournamentModal"
      @save="saveWeeklyTournament"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConvex } from '~/composables/useConvex'

// Types
interface WeeklyPuzzle {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  theme: string
  fen: string
  solution: string[]
  weekOf: string
}

interface WeeklyFeature {
  id: string
  title: string
  description: string
  type: 'article' | 'video' | 'tip' | 'strategy'
  content: string
  targetAudience: string
  weekOf: string
}

interface WeeklyTournament {
  id: string
  name: string
  description: string
  startTime: string
  format: 'blitz' | 'rapid' | 'classical' | 'bullet'
  timeControl: string
  maxParticipants?: number
  weekOf: string
}

// Composables
const { api } = useConvex()

// State
const currentWeek = ref(new Date())
const weeklyPuzzle = ref<WeeklyPuzzle | null>(null)
const weeklyFeature = ref<WeeklyFeature | null>(null)
const weeklyTournament = ref<WeeklyTournament | null>(null)
const lastLeaderboardReset = ref<string>('')
const nextLeaderboardReset = ref<string>('')

const showPuzzleModal = ref(false)
const showFeatureModal = ref(false)
const showTournamentModal = ref(false)
const editingPuzzle = ref<WeeklyPuzzle | null>(null)
const editingFeature = ref<WeeklyFeature | null>(null)
const editingTournament = ref<WeeklyTournament | null>(null)

// Computed
const currentWeekDisplay = computed(() => {
  const start = getWeekStart(currentWeek.value)
  const end = getWeekEnd(currentWeek.value)
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
})

// Methods
const getWeekStart = (date: Date) => {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  return start
}

const getWeekEnd = (date: Date) => {
  const end = new Date(date)
  end.setDate(date.getDate() - date.getDay() + 6)
  return end
}

const getWeekIdentifier = (date: Date) => {
  const start = getWeekStart(date)
  return start.toISOString().split('T')[0]
}

const navigateWeek = (direction: number) => {
  const newDate = new Date(currentWeek.value)
  newDate.setDate(newDate.getDate() + (direction * 7))
  currentWeek.value = newDate
  loadWeeklyContent()
}

const goToCurrentWeek = () => {
  currentWeek.value = new Date()
  loadWeeklyContent()
}

const loadWeeklyContent = async () => {
  const weekId = getWeekIdentifier(currentWeek.value)
  
  try {
    const [puzzle, feature, tournament, leaderboardInfo] = await Promise.all([
      api.query('weekly_content', 'getWeeklyPuzzle', { weekOf: weekId }),
      api.query('weekly_content', 'getWeeklyFeature', { weekOf: weekId }),
      api.query('weekly_content', 'getWeeklyTournament', { weekOf: weekId }),
      api.query('weekly_content', 'getLeaderboardInfo')
    ])
    
    weeklyPuzzle.value = puzzle
    weeklyFeature.value = feature
    weeklyTournament.value = tournament
    lastLeaderboardReset.value = leaderboardInfo.lastReset
    nextLeaderboardReset.value = leaderboardInfo.nextReset
  } catch (error) {
    console.error('Failed to load weekly content:', error)
  }
}

// Weekly Puzzle Methods
const setWeeklyPuzzle = () => {
  editingPuzzle.value = null
  showPuzzleModal.value = true
}

const editWeeklyPuzzle = () => {
  editingPuzzle.value = weeklyPuzzle.value
  showPuzzleModal.value = true
}

const closePuzzleModal = () => {
  showPuzzleModal.value = false
  editingPuzzle.value = null
}

const saveWeeklyPuzzle = async (puzzleData: any) => {
  try {
    const weekId = getWeekIdentifier(currentWeek.value)
    await api.mutation('weekly_content', 'setWeeklyPuzzle', {
      ...puzzleData,
      weekOf: weekId
    })
    await loadWeeklyContent()
    closePuzzleModal()
  } catch (error) {
    console.error('Failed to save weekly puzzle:', error)
  }
}

const removeWeeklyPuzzle = async () => {
  if (!weeklyPuzzle.value) return
  
  try {
    await api.mutation('weekly_content', 'removeWeeklyPuzzle', {
      id: weeklyPuzzle.value.id
    })
    await loadWeeklyContent()
  } catch (error) {
    console.error('Failed to remove weekly puzzle:', error)
  }
}

// Similar methods for features and tournaments...
const setWeeklyFeature = () => {
  editingFeature.value = null
  showFeatureModal.value = true
}

const editWeeklyFeature = () => {
  editingFeature.value = weeklyFeature.value
  showFeatureModal.value = true
}

const closeFeatureModal = () => {
  showFeatureModal.value = false
  editingFeature.value = null
}

const saveWeeklyFeature = async (featureData: any) => {
  try {
    const weekId = getWeekIdentifier(currentWeek.value)
    await api.mutation('weekly_content', 'setWeeklyFeature', {
      ...featureData,
      weekOf: weekId
    })
    await loadWeeklyContent()
    closeFeatureModal()
  } catch (error) {
    console.error('Failed to save weekly feature:', error)
  }
}

const removeWeeklyFeature = async () => {
  if (!weeklyFeature.value) return
  
  try {
    await api.mutation('weekly_content', 'removeWeeklyFeature', {
      id: weeklyFeature.value.id
    })
    await loadWeeklyContent()
  } catch (error) {
    console.error('Failed to remove weekly feature:', error)
  }
}

const scheduleWeeklyTournament = () => {
  editingTournament.value = null
  showTournamentModal.value = true
}

const editWeeklyTournament = () => {
  editingTournament.value = weeklyTournament.value
  showTournamentModal.value = true
}

const closeTournamentModal = () => {
  showTournamentModal.value = false
  editingTournament.value = null
}

const saveWeeklyTournament = async (tournamentData: any) => {
  try {
    const weekId = getWeekIdentifier(currentWeek.value)
    await api.mutation('weekly_content', 'setWeeklyTournament', {
      ...tournamentData,
      weekOf: weekId
    })
    await loadWeeklyContent()
    closeTournamentModal()
  } catch (error) {
    console.error('Failed to save weekly tournament:', error)
  }
}

const cancelWeeklyTournament = async () => {
  if (!weeklyTournament.value) return
  
  try {
    await api.mutation('weekly_content', 'cancelWeeklyTournament', {
      id: weeklyTournament.value.id
    })
    await loadWeeklyContent()
  } catch (error) {
    console.error('Failed to cancel weekly tournament:', error)
  }
}

const manualLeaderboardReset = async () => {
  try {
    await api.mutation('weekly_content', 'resetWeeklyLeaderboard')
    await loadWeeklyContent()
  } catch (error) {
    console.error('Failed to reset leaderboard:', error)
  }
}

const viewLeaderboardHistory = () => {
  // Navigate to leaderboard history page
  navigateTo('/admin/leaderboard-history')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  loadWeeklyContent()
})

definePageMeta({
  title: 'Weekly Content Management',
  middleware: 'admin'
})
</script>
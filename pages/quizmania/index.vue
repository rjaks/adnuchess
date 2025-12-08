<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div class="mx-auto max-w-6xl px-4 py-8">
      <!-- Header -->
      <header class="text-center mb-12">
        <div class="inline-flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            QuizMania
          </h1>
        </div>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto">
          Test your chess knowledge in fast-paced quiz battles! Answer questions about openings, tactics, history, and more.
        </p>
      </header>

      <!-- Game Mode Selection -->
      <div v-if="!currentSession" class="space-y-8">        <!-- Quick Stats -->
        <div v-if="userStats" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white/70 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-2xl font-bold text-purple-600">{{ userStats?.totalGames || 0 }}</div>
            <div class="text-sm text-slate-600 font-medium">Games Played</div>
          </div>
          <div class="bg-white/70 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-2xl font-bold text-indigo-600">{{ userStats?.averageScore || 0 }}</div>
            <div class="text-sm text-slate-600 font-medium">Average Score</div>
          </div>
          <div class="bg-white/70 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-2xl font-bold text-emerald-600">{{ userStats?.overallAccuracy || 0 }}%</div>
            <div class="text-sm text-slate-600 font-medium">Accuracy</div>
          </div>
          <div class="bg-white/70 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-2xl font-bold text-amber-600">{{ userStats?.totalScore || 0 }}</div>
            <div class="text-sm text-slate-600 font-medium">Total Score</div>
          </div>
        </div>

        <!-- Game Mode Cards -->
        <div class="grid md:grid-cols-3 gap-6">
          <!-- Practice Mode -->
          <div class="bg-white/80 rounded-3xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
               @click="selectGameMode('practice')">
            <div class="text-center space-y-4">
              <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-green-200 transition-colors">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-800">Practice Mode</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                No time pressure. Learn at your own pace with detailed explanations for each question.
              </p>
              <div class="text-green-600 font-semibold text-sm">✓ Unlimited time</div>
            </div>
          </div>

          <!-- Timed Challenge -->
          <div class="bg-white/80 rounded-3xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
               @click="selectGameMode('timed')">
            <div class="text-center space-y-4">
              <div class="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-orange-200 transition-colors">
                <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-800">Timed Challenge</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Race against the clock! Answer as many questions as possible in 5 minutes.
              </p>
              <div class="text-orange-600 font-semibold text-sm">⏱️ 5 minute limit</div>
            </div>
          </div>

          <!-- Quick Fire -->
          <div class="bg-white/80 rounded-3xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
               @click="selectGameMode('challenge')">
            <div class="text-center space-y-4">
              <div class="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-red-200 transition-colors">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-800">Quick Fire</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Lightning fast questions with limited time per question. Think fast!
              </p>
              <div class="text-red-600 font-semibold text-sm">⚡ 10 seconds per question</div>
            </div>
          </div>
        </div>

        <!-- Quiz Configuration Modal -->
        <div v-if="showConfig" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-slate-800 mb-2">Configure Quiz</h3>
              <p class="text-slate-600">{{ selectedMode?.title || 'Customize your quiz settings' }}</p>
            </div>

            <div class="space-y-4">
              <!-- Category Selection -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select v-model="quizConfig.category" class="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="mixed">Mixed Topics</option>
                  <option value="openings">Openings</option>
                  <option value="tactics">Tactics</option>
                  <option value="endgames">Endgames</option>
                  <option value="history">Chess History</option>
                  <option value="rules">Rules & Regulations</option>
                  <option value="famous-games">Famous Games</option>
                  <option value="theory">Chess Theory</option>
                </select>
              </div>

              <!-- Difficulty Selection -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Difficulty</label>
                <select v-model="quizConfig.difficulty" class="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="mixed">Mixed Difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <!-- Number of Questions -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Number of Questions</label>
                <select v-model="quizConfig.questionCount" class="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option :value="5">5 Questions (Quick)</option>
                  <option :value="10">10 Questions (Standard)</option>
                  <option :value="20">20 Questions (Extended)</option>
                </select>
              </div>
            </div>

            <div class="flex gap-3">
              <button @click="showConfig = false" 
                      class="flex-1 px-6 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button @click="startQuiz" :disabled="starting"
                      class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50">
                {{ starting ? 'Starting...' : 'Start Quiz' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Leaderboard Section -->
        <div class="mt-12">
          <h2 class="text-2xl font-bold text-slate-800 mb-6 text-center">🏆 Top Quiz Masters</h2>
          <div class="bg-white/80 rounded-3xl p-6 border border-white/60">
            <div v-if="leaderboard.length === 0" class="text-center py-8">
              <div class="text-slate-400 text-lg">No quiz results yet. Be the first!</div>
            </div>            <div v-else class="space-y-3">
              <div v-for="(entry, index) in leaderboard.slice(0, 10)" :key="entry?._id || index"
                   class="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                       :class="index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                               index === 1 ? 'bg-gray-100 text-gray-700' :
                               index === 2 ? 'bg-amber-100 text-amber-700' :
                               'bg-slate-100 text-slate-600'">
                    {{ index + 1 }}
                  </div>
                  <div>
                    <div class="font-semibold text-slate-800">{{ entry?.displayName || 'Unknown' }}</div>
                    <div class="text-sm text-slate-500">{{ entry?.department || 'Unknown' }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-purple-600">{{ entry?.bestScore || 0 }}</div>
                  <div class="text-sm text-slate-500">{{ Math.round(entry?.bestAccuracy || 0) }}% accuracy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Quiz Session -->
      <QuizSession v-else 
                   :session="currentSession" 
                   @quiz-completed="handleQuizCompleted"
                   @quit-quiz="handleQuitQuiz"
                   @retry-quiz="handleRetryQuiz" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const { $convex } = useNuxtApp()
const { user } = useAuth()

// Types
interface GameMode {
  title: string
  description: string
  icon: string
}

interface UserStats {
  totalGames: number
  averageScore: number
  overallAccuracy: number
  totalScore: number
}

interface LeaderboardEntry {
  _id: string
  displayName: string
  department: string
  bestScore: number
  bestAccuracy: number
}

// Component state
const currentSession = ref<any>(null)
const showConfig = ref(false)
const starting = ref(false)
const selectedGameMode = ref<GameMode | null>(null)
const selectedGameModeKey = ref<string | null>(null)
const userStats = ref<UserStats | null>(null)
const leaderboard = ref<LeaderboardEntry[]>([])

// Quiz configuration
const quizConfig = ref({
  category: 'mixed',
  difficulty: 'mixed',
  questionCount: 10
})

// Game mode definitions
const gameModes: Record<string, GameMode> = {
  practice: {
    title: 'Practice Mode',
    description: 'Learn at your own pace',
    icon: '📚'
  },
  timed: {
    title: 'Timed Challenge', 
    description: '5 minutes to answer as many as possible',
    icon: '⏱️'
  },
  challenge: {
    title: 'Quick Fire',
    description: '10 seconds per question',
    icon: '⚡'
  }
}

// Computed properties
const selectedMode = computed(() => selectedGameMode.value)

// Select game mode and show configuration
const selectGameMode = (mode: string) => {
  const gameMode = gameModes[mode as keyof typeof gameModes]
  if (gameMode) {
    selectedGameMode.value = gameMode
    selectedGameModeKey.value = mode
    showConfig.value = true
  }
}

// Start quiz with selected configuration
const startQuiz = async () => {
  if (!user.value) return
  
  starting.value = true
    try {
    const result = await $convex.mutation("quiz:startQuizSession", {
      userId: user.value.id,
      gameMode: selectedGameModeKey.value as "practice" | "timed" | "challenge",
      category: quizConfig.value.category === 'mixed' ? undefined : quizConfig.value.category,
      difficulty: quizConfig.value.difficulty === 'mixed' ? undefined : quizConfig.value.difficulty,
      questionCount: quizConfig.value.questionCount,
    })
    
    // Load the session
    currentSession.value = await $convex.query("quiz:getQuizSession", {
      sessionId: result.sessionId
    })
    
    showConfig.value = false
  } catch (error) {
    console.error('Failed to start quiz:', error)
    alert('Failed to start quiz. Please try again.')
  } finally {
    starting.value = false
  }
}

// Handle quiz completion
const handleQuizCompleted = async (sessionId: string) => {
  console.log('[QuizMania] Quiz completed, sessionId:', sessionId)
  
  console.log('[QuizMania] Navigating to results page:', `/quizmania/results/${sessionId}`)
  // Navigate to results page FIRST before clearing session
  try {
    await navigateTo(`/quizmania/results/${sessionId}`, { 
      replace: false,
      external: false 
    })
    console.log('[QuizMania] Navigation completed')
  } catch (error) {
    console.error('[QuizMania] Navigation error:', error)
  }
  
  // Clear session AFTER navigation
  currentSession.value = null
  
  // Refresh user stats and leaderboard in background
  loadUserStats()
  loadLeaderboard()
}

// Handle quit quiz
const handleQuitQuiz = () => {
  currentSession.value = null
}

// Handle retry quiz
const handleRetryQuiz = () => {
  currentSession.value = null
  // Automatically show config with the same settings
  showConfig.value = true
}

// Load user statistics
const loadUserStats = async () => {
  if (!user.value) return
  
  try {
    userStats.value = await $convex.query("quiz:getUserQuizStats", {
      userId: user.value.id
    })
  } catch (error) {
    console.error('Failed to load user stats:', error)
  }
}

// Load leaderboard
const loadLeaderboard = async () => {
  try {
    leaderboard.value = await $convex.query("quiz:getQuizLeaderboard", {
      limit: 10
    })
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
  }
}

// Load data on mount
onMounted(async () => {
  console.log('[QuizMania] onMounted called')
  
  // Check for auto-open mode from sessionStorage FIRST (before loading stats)
  let autoOpenMode = null
  if (typeof window !== 'undefined') {
    autoOpenMode = sessionStorage.getItem('quizmania_autoOpenMode')
    console.log('[QuizMania] Auto-open mode from sessionStorage:', autoOpenMode)
    
    if (autoOpenMode && gameModes[autoOpenMode]) {
      sessionStorage.removeItem('quizmania_autoOpenMode') // Clear it immediately
    }
  }
  
  // Load stats in background
  await Promise.all([
    loadUserStats(),
    loadLeaderboard()
  ])
  
  // Open modal after stats load if needed
  if (autoOpenMode && gameModes[autoOpenMode]) {
    console.log('[QuizMania] Auto-opening config for mode:', autoOpenMode)
    await nextTick() // Wait for DOM update
    selectGameMode(autoOpenMode)
  }
  
  // Also check route query parameters as fallback
  const route = useRoute()
  console.log('[QuizMania] Route query:', route.query)
  
  if (route.query.openConfig === 'true' && route.query.mode) {
    const mode = route.query.mode as string
    console.log('[QuizMania] Auto-opening config for mode from query:', mode)
    
    if (gameModes[mode]) {
      selectGameMode(mode)
    }
  }
})

// Set page metadata
definePageMeta({
  title: 'QuizMania - AdNU Chess Arena',
  description: 'Test your chess knowledge with fast-paced quiz challenges'
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <div class="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-600">Loading your results...</p>
      </div>

      <!-- Results Display -->
      <div v-else-if="results" class="space-y-8">
        <!-- Header -->
        <div class="text-center space-y-4">
          <div class="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
               :class="getScoreColorClass(results.session.totalScore, results.session.totalQuestions * 10)">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-slate-800">Quiz Complete!</h1>
          <p class="text-slate-600">{{ getPerformanceMessage(results.stats.accuracy) }}</p>
        </div>

        <!-- Score Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white/80 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-3xl font-bold text-purple-600">{{ results.session.totalScore }}</div>
            <div class="text-sm text-slate-600 font-medium">Total Score</div>
          </div>
          <div class="bg-white/80 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-3xl font-bold text-indigo-600">{{ Math.round(results.stats.accuracy) }}%</div>
            <div class="text-sm text-slate-600 font-medium">Accuracy</div>
          </div>
          <div class="bg-white/80 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-3xl font-bold text-emerald-600">{{ results.session.correctAnswers }}/{{ results.session.totalQuestions }}</div>
            <div class="text-sm text-slate-600 font-medium">Correct</div>
          </div>
          <div class="bg-white/80 rounded-2xl p-6 text-center border border-white/60">
            <div class="text-3xl font-bold text-amber-600">{{ Math.round(results.stats.averageTimePerQuestion) }}s</div>
            <div class="text-sm text-slate-600 font-medium">Avg Time</div>
          </div>
        </div>

        <!-- Question Review -->
        <div class="bg-white/80 rounded-3xl p-8 border border-white/60">
          <h2 class="text-xl font-bold text-slate-800 mb-6">Question Review</h2>
          <div class="space-y-6">
            <div v-for="(answer, index) in results.detailedAnswers" :key="index"
                 class="p-6 rounded-2xl border-2"
                 :class="answer.isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'">
              
              <!-- Question Number & Status -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                       :class="answer.isCorrect ? 'bg-green-500' : 'bg-red-500'">
                    {{ index + 1 }}
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold" :class="answer.isCorrect ? 'text-green-700' : 'text-red-700'">
                      {{ answer.isCorrect ? 'Correct' : 'Incorrect' }}
                    </span>
                    <span class="text-sm text-slate-600">{{ Math.round(answer.timeSpent / 1000) }}s</span>
                  </div>
                </div>
                <div class="text-sm font-semibold" :class="answer.isCorrect ? 'text-green-600' : 'text-red-600'">
                  +{{ answer.score }} points
                </div>
              </div>

              <!-- Question Text -->
              <div class="mb-4">
                <h4 class="font-medium text-slate-800 mb-2">{{ answer.question }}</h4>
              </div>

              <!-- Answer Options -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div v-for="(option, optionIndex) in answer.options" :key="optionIndex"
                     class="p-3 rounded-xl border text-sm"
                     :class="getReviewOptionClasses(optionIndex, answer)">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold">{{ String.fromCharCode(65 + optionIndex) }}.</span>
                    <span>{{ option }}</span>
                  </div>
                </div>
              </div>

              <!-- Explanation -->
              <div v-if="answer.explanation" class="mt-4 p-4 bg-slate-50 rounded-xl">
                <div class="text-sm text-slate-700">
                  <strong>Explanation:</strong> {{ answer.explanation }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button @click="playAgain" 
                  class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
            Play Again
          </button>
          <button @click="backToMenu" 
                  class="px-8 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
            Back to Menu
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-16">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-slate-800 mb-2">Results Not Found</h2>
        <p class="text-slate-600 mb-6">We couldn't load your quiz results.</p>
        <button @click="backToMenu" 
                class="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors">
          Back to QuizMania
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

console.log('[Results] Component script executing')

const route = useRoute()
const { $convex } = useNuxtApp()

// Use _sessionId for Nuxt 2 style params, or sessionId for Nuxt 3 bracket style
const sessionId = computed(() => route.params.sessionId || route.params._sessionId)

console.log('[Results] Route params:', route.params)
console.log('[Results] Session ID:', sessionId.value)

const loading = ref(true)
const results = ref(null)

// Load quiz results
const loadResults = async () => {
  const id = sessionId.value as string
  console.log('[Results] Loading results for sessionId:', id)
  
  if (!id) {
    console.log('[Results] No sessionId found')
    loading.value = false
    return
  }

  try {
    console.log('[Results] Calling quiz:getQuizResults with sessionId:', id)
    console.log('[Results] Type of sessionId:', typeof id)
    results.value = await $convex.query("quiz:getQuizResults", {
      sessionId: id as any
    })
    console.log('[Results] Results loaded successfully:', !!results.value)
    if (results.value) {
      console.log('[Results] Score:', results.value.session.totalScore)
    }
  } catch (error) {
    console.error('[Results] Failed to load quiz results:', error)
  } finally {
    loading.value = false
  }
}

// Get score color class based on performance
const getScoreColorClass = (score: number, maxScore: number) => {
  const percentage = (score / maxScore) * 100
  if (percentage >= 90) return 'bg-gradient-to-br from-green-500 to-green-600'
  if (percentage >= 80) return 'bg-gradient-to-br from-blue-500 to-blue-600'
  if (percentage >= 70) return 'bg-gradient-to-br from-yellow-500 to-yellow-600'
  if (percentage >= 60) return 'bg-gradient-to-br from-orange-500 to-orange-600'
  return 'bg-gradient-to-br from-red-500 to-red-600'
}

// Get performance message
const getPerformanceMessage = (accuracy: number) => {
  if (accuracy >= 90) return "Outstanding! You're a chess knowledge master! 🏆"
  if (accuracy >= 80) return "Excellent work! You really know your chess! 🌟"
  if (accuracy >= 70) return "Great job! You have solid chess knowledge! 👏"
  if (accuracy >= 60) return "Good effort! Keep studying to improve! 📚"
  return "Keep practicing! Every master was once a beginner! 💪"
}

// Get review option classes
const getReviewOptionClasses = (optionIndex: number, answer: any) => {
  const isUserAnswer = answer.userAnswer === optionIndex
  const isCorrectAnswer = optionIndex === answer.correctAnswer

  if (isCorrectAnswer) {
    return 'border-green-300 bg-green-100 text-green-800'
  }
  if (isUserAnswer && !answer.isCorrect) {
    return 'border-red-300 bg-red-100 text-red-800'
  }
  return 'border-slate-200 bg-white text-slate-700'
}

// Navigation functions
const playAgain = () => {
  console.log('[Results] Play Again function called')
  console.log('[Results] Results value:', results.value)
  
  // Get the game mode from results to pre-select it
  const gameMode = results.value?.session?.gameMode || 'practice'
  console.log('[Results] Game mode extracted:', gameMode)
  
  // Store the mode in sessionStorage to trigger modal on next page
  if (typeof window !== 'undefined') {
    console.log('[Results] Setting sessionStorage')
    sessionStorage.setItem('quizmania_autoOpenMode', gameMode)
    console.log('[Results] SessionStorage set to:', sessionStorage.getItem('quizmania_autoOpenMode'))
  }
  
  console.log('[Results] Navigating to /quizmania')
  navigateTo('/quizmania')
}

const backToMenu = () => {
  navigateTo('/quizmania')
}

// Load results on mount
onMounted(() => {
  console.log('[Results] onMounted called')
  loadResults()
})

// Set page metadata
definePageMeta({
  title: 'Quiz Results - QuizMania',
})
</script>

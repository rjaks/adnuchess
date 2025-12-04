<template>
  <div class="max-w-4xl mx-auto">
    <!-- Quiz Header -->
    <div class="bg-white/90 rounded-2xl p-6 mb-6 border border-white/60">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="$emit('quit-quiz')" 
                  class="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <h2 class="text-xl font-bold text-slate-800">{{ session.category }} Quiz</h2>
            <p class="text-sm text-slate-600">{{ session.difficulty }} • {{ session.gameMode }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-6">
          <!-- Progress -->
          <div class="text-center">
            <div class="text-lg font-bold text-slate-800">{{ session.currentQuestionIndex + 1 }} / {{ session.totalQuestions }}</div>
            <div class="text-xs text-slate-500">Questions</div>
          </div>
          
          <!-- Score -->
          <div class="text-center">
            <div class="text-lg font-bold text-purple-600">{{ session.totalScore }}</div>
            <div class="text-xs text-slate-500">Score</div>
          </div>
          
          <!-- Timer -->
          <div v-if="timeRemaining !== null" class="text-center">
            <div class="text-lg font-bold" :class="timeRemaining < 30 ? 'text-red-600' : 'text-orange-600'">
              {{ formatTime(timeRemaining) }}
            </div>
            <div class="text-xs text-slate-500">Time Left</div>
          </div>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="mt-4 w-full bg-slate-200 rounded-full h-2">
        <div class="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
             :style="{ width: `${(session.currentQuestionIndex / session.totalQuestions) * 100}%` }">
        </div>
      </div>
    </div>

    <!-- Question Card -->
    <div v-if="session.currentQuestion" class="bg-white/90 rounded-3xl p-8 border border-white/60 mb-6">
      <!-- Question -->
      <div class="mb-8">
        <div class="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">
          {{ session.currentQuestion.category }} • {{ session.currentQuestion.difficulty }}
        </div>
        <h3 class="text-2xl font-bold text-slate-800 leading-relaxed mb-4">
          {{ session.currentQuestion.question }}
        </h3>
        
        <!-- Question Timer -->
        <div v-if="questionTimeRemaining !== null" class="flex items-center gap-2 text-sm">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-slate-600">{{ questionTimeRemaining }}s remaining</span>
          <div class="flex-1 bg-slate-200 rounded-full h-1 ml-2">
            <div class="bg-orange-500 h-1 rounded-full transition-all duration-1000"
                 :style="{ width: `${(questionTimeRemaining / session.currentQuestion.timeLimit) * 100}%` }">
            </div>
          </div>
        </div>
      </div>

      <!-- Answer Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button v-for="(option, index) in displayOptions" 
                :key="index"
                @click="selectAnswer(index)"
                :disabled="answerSubmitted"
                class="p-6 text-left rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed"
                :class="getOptionClasses(index)">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                 :class="getOptionNumberClasses(index)">
              {{ String.fromCharCode(65 + index) }}
            </div>
            <span class="font-medium">{{ option }}</span>
          </div>
        </button>
      </div>

      <!-- Answer Feedback -->
      <div v-if="showFeedback" class="mt-6 p-6 rounded-2xl" 
           :class="lastAnswerResult?.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
        <div class="flex items-start gap-3">
          <div class="mt-1">
            <svg v-if="lastAnswerResult?.isCorrect" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg v-else class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <div class="font-semibold" :class="lastAnswerResult?.isCorrect ? 'text-green-800' : 'text-red-800'">
              {{ lastAnswerResult?.isCorrect ? 'Correct!' : 'Incorrect' }}
              <span class="font-normal">
                {{ lastAnswerResult?.isCorrect ? `+${lastAnswerResult.pointsEarned} points` : '' }}
              </span>
            </div>
            <div v-if="!lastAnswerResult?.isCorrect" class="text-sm text-red-700 mt-1">
              Correct answer: {{ String.fromCharCode(65 + lastAnswerResult?.correctAnswer) }}. 
              {{ session.currentQuestion.options[lastAnswerResult?.correctAnswer] }}
            </div>
            <div v-if="lastAnswerResult?.explanation" class="text-sm mt-2 text-slate-700">
              <strong>Explanation:</strong> {{ lastAnswerResult.explanation }}
            </div>
          </div>
        </div>
      </div>

      <!-- Next Button -->
      <div v-if="showFeedback" class="mt-6 text-center">
        <button @click="nextQuestion" 
                class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
          {{ lastAnswerResult?.isComplete ? 'View Results' : 'Next Question' }}
        </button>
      </div>
    </div>

    <!-- Quiz Complete -->
    <div v-if="session.status === 'completed'" class="text-center py-12">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
      <p class="text-slate-600 mb-6">Great job! Let's see how you did.</p>
      <button @click="$emit('quiz-completed', session._id)" 
              class="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
        View Results
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

// Types
interface AnswerResult {
  isCorrect: boolean
  correctAnswer: number
  pointsEarned: number
  explanation?: string
  isComplete: boolean
}

const props = defineProps<{
  session: any
}>()

const emits = defineEmits<{
  'quiz-completed': [sessionId: string]
  'quit-quiz': []
}>()

const { $convex } = useNuxtApp()
const optionOrder = ref<Record<string, number[]>>({})

// Component state
const selectedAnswer = ref<number | null>(null)
const answerSubmitted = ref(false)
const showFeedback = ref(false)
const lastAnswerResult = ref<AnswerResult | null>(null)
const questionStartTime = ref(Date.now())
const questionTimeRemaining = ref<number | null>(null)
const timeRemaining = ref<number | null>(null)
const questionTimer = ref<NodeJS.Timeout | null>(null)
const globalTimer = ref<NodeJS.Timeout | null>(null)

const currentQuestionId = computed(() => props.session.currentQuestion?._id)

const displayOptions = computed(() => {
  const question = props.session.currentQuestion
  if (!question) return []
  const order = optionOrder.value[question._id] || question.options.map((_, idx) => idx)
  return order.map((idx) => question.options[idx])
})

const ensureOptionOrder = () => {
  const question = props.session.currentQuestion
  if (!question) return
  if (!optionOrder.value[question._id]) {
    const order = [...question.options.keys()].sort(() => Math.random() - 0.5)
    optionOrder.value = { ...optionOrder.value, [question._id]: order }
  }
}

// Initialize timers
const initializeTimers = () => {
  // Question-specific timer for challenge mode
  if (props.session.gameMode === 'challenge' && props.session.currentQuestion) {
    questionTimeRemaining.value = props.session.currentQuestion.timeLimit
    
    questionTimer.value = setInterval(() => {
      if (questionTimeRemaining.value !== null && questionTimeRemaining.value > 0) {
        questionTimeRemaining.value--
      } else {
        // Time's up - auto submit
        selectAnswer(null)
      }
    }, 1000)
  }
  
  // Global timer for timed mode
  if (props.session.gameMode === 'timed' && props.session.timeRemaining) {
    timeRemaining.value = Math.floor(props.session.timeRemaining / 1000)
    
    globalTimer.value = setInterval(() => {
      if (timeRemaining.value !== null && timeRemaining.value > 0) {
        timeRemaining.value--
      } else {
        // Time's up - end quiz
        endQuiz()
      }
    }, 1000)
  }
}

// Clean up timers
const cleanupTimers = () => {
  if (questionTimer.value) {
    clearInterval(questionTimer.value)
    questionTimer.value = null
  }
  if (globalTimer.value) {
    clearInterval(globalTimer.value)
    globalTimer.value = null
  }
}

// Select answer and submit
const selectAnswer = async (answerIndex: number | null) => {
  if (answerSubmitted.value) return
  
  selectedAnswer.value = answerIndex
  answerSubmitted.value = true
  
  const timeSpent = Date.now() - questionStartTime.value
  cleanupTimers()
  
  try {
    const question = props.session.currentQuestion
    const order = question ? optionOrder.value[question._id] || [] : []
    const originalAnswer = answerIndex !== null ? (order[answerIndex] ?? answerIndex) : null

    const result = await $convex.mutation("quiz:submitAnswer", {
      sessionId: props.session._id,
      answer: originalAnswer,
      timeSpent,
    })
    
    lastAnswerResult.value = result
    showFeedback.value = true
    
    // Update session data
    Object.assign(props.session, {
      totalScore: result.totalScore,
      currentQuestionIndex: props.session.currentQuestionIndex + 1,
      status: result.isComplete ? 'completed' : 'active'
    })
    
  } catch (error) {
    console.error('Failed to submit answer:', error)
    answerSubmitted.value = false
  }
}

// Move to next question
const nextQuestion = async () => {
  if (lastAnswerResult.value?.isComplete) {
    emits('quiz-completed', props.session._id)
    return
  }
  
  // Reset state
  selectedAnswer.value = null
  answerSubmitted.value = false
  showFeedback.value = false
  lastAnswerResult.value = null
  questionStartTime.value = Date.now()
  
  // Load next question
  try {
    const updatedSession = await $convex.query("quiz:getQuizSession", {
      sessionId: props.session._id
    })
    
    Object.assign(props.session, updatedSession)
    ensureOptionOrder()
    initializeTimers()
    
  } catch (error) {
    console.error('Failed to load next question:', error)
  }
}

// End quiz (for time limits)
const endQuiz = async () => {
  cleanupTimers()
  emits('quiz-completed', props.session._id)
}

// Get option styling classes
const getOptionClasses = (index: number) => {
  if (!answerSubmitted.value) {
    return 'border-slate-200 hover:border-purple-300 hover:bg-purple-50'
  }
  
  if (showFeedback.value && lastAnswerResult.value) {
    const correctDisplayIndex = getCorrectDisplayIndex()
    if (index === correctDisplayIndex) {
      return 'border-green-300 bg-green-50'
    }
    if (index === selectedAnswer.value && index !== correctDisplayIndex) {
      return 'border-red-300 bg-red-50'
    }
  }
  
  return 'border-slate-200 bg-slate-50'
}

// Get option number styling
const getOptionNumberClasses = (index: number) => {
  if (!answerSubmitted.value) {
    return 'bg-slate-100 text-slate-600'
  }
  
  if (showFeedback.value && lastAnswerResult.value) {
    const correctDisplayIndex = getCorrectDisplayIndex()
    if (index === correctDisplayIndex) {
      return 'bg-green-100 text-green-700'
    }
    if (index === selectedAnswer.value && index !== correctDisplayIndex) {
      return 'bg-red-100 text-red-700'
    }
  }
  
  return 'bg-slate-100 text-slate-600'
}

const getCorrectDisplayIndex = () => {
  const question = props.session.currentQuestion
  const correct = lastAnswerResult.value?.correctAnswer
  if (!question || correct === undefined || correct === null) return null
  const order = optionOrder.value[question._id] || []
  const idx = order.indexOf(correct)
  return idx >= 0 ? idx : null
}

// Format time display
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Watch for session changes to reinitialize
watch(() => props.session.currentQuestion, () => {
  if (props.session.currentQuestion) {
    ensureOptionOrder()
    if (!answerSubmitted.value) {
      questionStartTime.value = Date.now()
      initializeTimers()
    }
  }
}, { immediate: true })

// Initialize on mount
onMounted(() => {
  questionStartTime.value = Date.now()
  ensureOptionOrder()
  initializeTimers()
})

// Cleanup on unmount
onUnmounted(() => {
  cleanupTimers()
})
</script>

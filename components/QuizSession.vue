<template>
  <div class="max-w-4xl mx-auto">
    <!-- Quiz Header -->
    <div v-if="!showTimeUpModal" class="bg-white/90 rounded-2xl p-6 mb-6 border border-white/60">
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
    <div v-if="session.currentQuestion && !showTimeUpModal && !showCompletionModal" class="bg-white/90 rounded-3xl p-8 border border-white/60 mb-6">
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

    <!-- Time's Up Modal -->
    <div v-if="showTimeUpModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-800 mb-2">Time's Up!</h2>
          <p class="text-slate-600 mb-4">The 5-minute timer has expired.</p>
          
          <div class="bg-purple-50 rounded-xl p-4 mb-6">
            <div class="text-sm text-slate-600 mb-1">Your Score</div>
            <div class="text-3xl font-bold text-purple-600">{{ session.totalScore }}</div>
            <div class="text-sm text-slate-500 mt-1">
              {{ session.correctAnswers }} / {{ session.currentQuestionIndex }} correct
            </div>
          </div>
          
          <div class="flex gap-3">
            <button @click="tryAgain" 
                    class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
              Try Again
            </button>
            <button @click="viewResults" 
                    class="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all">
              View Results
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quiz Completion Modal -->
    <div v-if="showCompletionModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div class="text-center">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
               :class="getCompletionColorClass()">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-slate-800 mb-2">{{ getCompletionTitle() }}</h2>
          <p class="text-slate-600 mb-6">{{ getCompletionMessage() }}</p>
          
          <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 mb-6">
            <div class="text-sm text-slate-600 mb-2">Your Score</div>
            <div class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {{ session.totalScore }}
            </div>
            <div class="text-sm text-slate-600">
              {{ session.correctAnswers }} / {{ session.totalQuestions }} correct
            </div>
            <div class="text-sm text-purple-600 font-semibold mt-2">
              {{ Math.round((session.correctAnswers / session.totalQuestions) * 100) }}% Accuracy
            </div>
          </div>
          
          <div class="flex gap-3">
            <button @click="tryAgain" 
                    class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
              Try Again
            </button>
            <button @click="viewResults" 
                    class="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all">
              View Results
            </button>
          </div>
        </div>
      </div>
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
  'retry-quiz': []
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
const showTimeUpModal = ref(false)
const showCompletionModal = ref(false)

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
  // Question-specific timer for challenge mode (Quick Fire)
  if (props.session.gameMode === 'challenge' && props.session.currentQuestion) {
    // Clean up question timer only
    if (questionTimer.value) {
      clearInterval(questionTimer.value)
      questionTimer.value = null
    }
    
    // Force 10 seconds for all Quick Fire questions
    questionTimeRemaining.value = 10
    
    questionTimer.value = setInterval(() => {
      if (questionTimeRemaining.value !== null && questionTimeRemaining.value > 0) {
        questionTimeRemaining.value--
      } else {
        // Time's up - auto submit
        selectAnswer(null)
      }
    }, 1000)
  }
  
  // Global timer for timed mode - only initialize once, not on every question
  if (props.session.gameMode === 'timed' && props.session.timeRemaining && !globalTimer.value) {
    timeRemaining.value = Math.floor(props.session.timeRemaining / 1000)
    
    console.log('[Timer] Initializing global timer with', timeRemaining.value, 'seconds')
    
    globalTimer.value = setInterval(() => {
      if (timeRemaining.value !== null && timeRemaining.value > 0) {
        timeRemaining.value--
        if (timeRemaining.value % 10 === 0) {
          console.log('[Timer] Time remaining:', timeRemaining.value)
        }
      } else {
        // Time's up - end quiz
        console.log('[Timer] Time is up! Calling endQuiz()')
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

// Clean up only question timer (for Quick Fire mode)
const cleanupQuestionTimer = () => {
  if (questionTimer.value) {
    clearInterval(questionTimer.value)
    questionTimer.value = null
  }
}

// Select answer and submit
const selectAnswer = async (answerIndex: number | null) => {
  if (answerSubmitted.value) return
  
  selectedAnswer.value = answerIndex
  answerSubmitted.value = true
  
  const timeSpent = Date.now() - questionStartTime.value
  
  // Only cleanup question timer for Quick Fire, keep global timer running for Timed Challenge
  if (props.session.gameMode === 'challenge') {
    cleanupQuestionTimer()
  }
  
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
    
    // Update session data (don't increment currentQuestionIndex yet)
    Object.assign(props.session, {
      totalScore: result.totalScore,
      status: result.isComplete ? 'completed' : 'active'
    })
    
    // Stop the global timer when quiz is complete
    if (result.isComplete && globalTimer.value) {
      clearInterval(globalTimer.value)
      globalTimer.value = null
    }
    
    // Show completion modal immediately when quiz is complete
    if (result.isComplete) {
      console.log('[SelectAnswer] Quiz complete, showing completion modal immediately')
      // Small delay to show the feedback first
      setTimeout(() => {
        showCompletionModal.value = true
        console.log('[SelectAnswer] Completion modal displayed')
      }, 1500) // 1.5 second delay to let user see if they got the last answer right
    }
    
  } catch (error) {
    console.error('Failed to submit answer:', error)
    answerSubmitted.value = false
  }
}

// Move to next question
const nextQuestion = async () => {
  if (lastAnswerResult.value?.isComplete) {
    // Quiz is complete - show completion modal
    console.log('[NextQuestion] Quiz complete, showing completion modal')
    cleanupTimers()
    showCompletionModal.value = true
    console.log('[NextQuestion] showCompletionModal set to:', showCompletionModal.value)
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
    
    // Increment the question index when actually moving to the next question
    Object.assign(props.session, {
      ...updatedSession,
      currentQuestionIndex: props.session.currentQuestionIndex + 1
    })
    ensureOptionOrder()
    initializeTimers()
    
  } catch (error) {
    console.error('Failed to load next question:', error)
  }
}

// End quiz (for time limits)
const endQuiz = async () => {
  console.log('[EndQuiz] Called, gameMode:', props.session.gameMode)
  cleanupTimers()
  
  // For timed mode, show the time-up modal immediately
  if (props.session.gameMode === 'timed') {
    console.log('[EndQuiz] Timed mode detected, showing modal immediately')
    
    // Update local session status
    props.session.status = 'completed'
    
    console.log('[EndQuiz] Setting showTimeUpModal to true')
    showTimeUpModal.value = true
    
    // Save the session in the background (don't wait for it)
    $convex.mutation("quiz:endTimedQuiz", {
      sessionId: props.session._id
    }).catch(error => {
      console.error('[EndQuiz] Failed to save timed quiz (non-blocking):', error)
    })
  } else {
    console.log('[EndQuiz] Not timed mode, emitting quiz-completed')
    emits('quiz-completed', props.session._id)
  }
}

// Time-up modal: Try again
const tryAgain = () => {
  console.log('[TryAgain] Closing modals and retrying quiz')
  showTimeUpModal.value = false
  showCompletionModal.value = false
  emits('retry-quiz')
}

// Time-up modal: View results
const viewResults = () => {
  const sessionId = props.session._id
  console.log('[ViewResults] Button clicked')
  console.log('[ViewResults] Session object:', props.session)
  console.log('[ViewResults] Session ID:', sessionId)
  
  if (!sessionId) {
    console.error('[ViewResults] No session ID found!')
    return
  }
  
  showTimeUpModal.value = false
  showCompletionModal.value = false
  console.log('[ViewResults] Emitting quiz-completed with sessionId:', sessionId)
  emits('quiz-completed', sessionId)
}

// Completion modal helpers
const getCompletionColorClass = () => {
  const accuracy = (props.session.correctAnswers / props.session.totalQuestions) * 100
  if (accuracy === 100) return 'bg-gradient-to-br from-yellow-400 to-amber-500'
  if (accuracy >= 80) return 'bg-gradient-to-br from-green-400 to-emerald-500'
  if (accuracy >= 60) return 'bg-gradient-to-br from-blue-400 to-indigo-500'
  return 'bg-gradient-to-br from-purple-400 to-purple-500'
}

const getCompletionTitle = () => {
  const accuracy = (props.session.correctAnswers / props.session.totalQuestions) * 100
  if (accuracy === 100) return 'Perfect! 🎉'
  if (accuracy >= 80) return 'Excellent! 🌟'
  if (accuracy >= 60) return 'Good Job! 👏'
  return 'Quiz Complete! ✨'
}

const getCompletionMessage = () => {
  const accuracy = (props.session.correctAnswers / props.session.totalQuestions) * 100
  if (accuracy === 100) return 'Outstanding! You got every question right!'
  if (accuracy >= 80) return 'Great work! You really know your chess!'
  if (accuracy >= 60) return 'Nice effort! Keep practicing to improve!'
  return 'Keep learning and you\'ll get better!'
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
})

// Watch for modal state changes
watch(showTimeUpModal, (newVal) => {
  console.log('[Modal] showTimeUpModal changed to:', newVal)
})

watch(showCompletionModal, (newVal) => {
  console.log('[Modal] showCompletionModal changed to:', newVal)
})

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

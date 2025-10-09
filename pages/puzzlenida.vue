<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="bg-gray-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-white">PuzzleNida</h1>
            <p class="text-gray-300 mt-1">Sharpen your chess tactics</p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <p class="text-sm text-gray-300">Points: {{ userPoints }}</p>
              <p class="text-xs text-gray-400">Solved: {{ solvedCount }}</p>
            </div>
            <NuxtLink 
              to="/" 
              class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
            >
              Back to Game
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-8">
        <select
          v-model="selectedDifficulty"
          @change="loadPuzzles"
          class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>

        <input
          v-model="selectedTheme"
          @input="loadPuzzles"
          placeholder="Filter by theme..."
          class="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
        />

        <button
          @click="loadPuzzles"
          class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <!-- Current Puzzle -->
      <div v-if="currentPuzzle" class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Chess Board -->
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">{{ currentPuzzle.title }}</h2>
            <div class="flex items-center space-x-4">
              <span :class="getDifficultyColor(currentPuzzle.difficulty)" class="px-3 py-1 text-sm font-semibold rounded-full">
                {{ currentPuzzle.difficulty }}
              </span>
              <span class="text-yellow-400 font-bold">{{ currentPuzzle.points }} pts</span>
            </div>
          </div>

          <!-- Mini Chess Board Display -->
          <div class="chess-board mb-4">
            <div 
              v-for="(row, rowIndex) in boardPosition" 
              :key="rowIndex"
              class="flex"
            >
              <div
                v-for="(square, colIndex) in row"
                :key="colIndex"
                :class="[
                  'w-12 h-12 flex items-center justify-center text-2xl border border-gray-600',
                  (rowIndex + colIndex) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-700'
                ]"
              >
                <span :class="getPieceColor(square)">{{ getPieceSymbol(square) }}</span>
              </div>
            </div>
          </div>

          <p v-if="currentPuzzle.description" class="text-gray-300 mb-4">
            {{ currentPuzzle.description }}
          </p>

          <div v-if="currentPuzzle.theme" class="text-sm text-blue-400 mb-4">
            Theme: {{ currentPuzzle.theme }}
          </div>

          <!-- Timer -->
          <div class="text-center">
            <p class="text-lg font-mono">{{ formatTime(elapsedTime) }}</p>
          </div>
        </div>

        <!-- Solution Input -->
        <div class="bg-gray-800 rounded-lg p-6">
          <h3 class="text-lg font-bold mb-4">Your Solution</h3>
          
          <div v-if="!submitted">
            <textarea
              v-model="userSolution"
              placeholder="Enter your move sequence (e.g., Nf3 d6 Bb5+)"
              rows="4"
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 font-mono mb-4"
            ></textarea>

            <div class="flex space-x-4">
              <button
                @click="submitSolution"
                :disabled="!userSolution.trim() || submitting"
                class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-semibold transition-colors"
              >
                {{ submitting ? 'Submitting...' : 'Submit Solution' }}
              </button>
              <button
                @click="skipPuzzle"
                class="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg text-white transition-colors"
              >
                Skip
              </button>
            </div>
          </div>

          <!-- Result Display -->
          <div v-else class="space-y-4">
            <div :class="lastResult?.isCorrect ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'" 
                 class="border rounded-lg p-4">
              <h4 :class="lastResult?.isCorrect ? 'text-green-400' : 'text-red-400'" class="font-bold text-lg mb-2">
                {{ lastResult?.isCorrect ? '✅ Correct!' : '❌ Incorrect' }}
              </h4>
              
              <p class="mb-2">
                <strong>Your answer:</strong> {{ userSolution }}
              </p>
              
              <p v-if="!lastResult?.isCorrect && lastResult?.correctSolution" class="mb-2">
                <strong>Correct answer:</strong> {{ lastResult.correctSolution }}
              </p>
              
              <p class="text-sm">
                Time taken: {{ formatTime(elapsedTime) }}
              </p>
              
              <p v-if="lastResult?.pointsEarned > 0" class="text-yellow-400 font-bold">
                Points earned: +{{ lastResult.pointsEarned }}
              </p>
            </div>

            <button
              @click="nextPuzzle"
              class="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold transition-colors"
            >
              Next Puzzle
            </button>
          </div>
        </div>
      </div>

      <!-- No Puzzles Available -->
      <div v-else-if="!loading" class="text-center py-20">
        <div class="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
          <h2 class="text-2xl font-bold mb-4">No Puzzles Available</h2>
          <p class="text-gray-300 mb-6">
            No puzzles match your current filters, or you've solved all available puzzles!
          </p>
          <button
            @click="resetFilters"
            class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-else class="text-center py-20">
        <p class="text-gray-400">Loading puzzles...</p>
      </div>

      <!-- Leaderboard -->
      <div class="bg-gray-800 rounded-lg p-6 mt-8">
        <h2 class="text-xl font-bold mb-4">Puzzle Leaderboard</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left py-2">Rank</th>
                <th class="text-left py-2">Player</th>
                <th class="text-left py-2">Points</th>
                <th class="text-left py-2">Solved</th>
                <th class="text-left py-2">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(player, index) in leaderboard" :key="player.userId" class="border-b border-gray-700">
                <td class="py-2">{{ index + 1 }}</td>
                <td class="py-2">{{ player.displayName }}</td>
                <td class="py-2 text-yellow-400 font-bold">{{ player.totalPoints }}</td>
                <td class="py-2">{{ player.correctSubmissions }}</td>
                <td class="py-2">{{ player.successRate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConvex } from '~/composables/useConvex'
import { useAuth } from '~/composables/useAuth'

// Page metadata
definePageMeta({
  // auth middleware is applied globally
})

// Composables
const { api } = useConvex()
const { user } = useAuth()

// Reactive data
const puzzles = ref<any[]>([])
const currentPuzzle = ref<any>(null)
const currentPuzzleIndex = ref(0)
const boardPosition = ref<string[][]>([])
const userSolution = ref('')
const submitted = ref(false)
const submitting = ref(false)
const lastResult = ref<any>(null)
const elapsedTime = ref(0)
const startTime = ref(0)
const timer = ref<any>(null)
const selectedDifficulty = ref('')
const selectedTheme = ref('')
const loading = ref(true)
const leaderboard = ref<any[]>([])
const userSubmissions = ref<any[]>([])

// Computed
const userPoints = computed(() => {
  return userSubmissions.value.reduce((total, sub) => total + (sub.pointsEarned || 0), 0)
})

const solvedCount = computed(() => {
  return userSubmissions.value.filter(sub => sub.isCorrect).length
})

// Methods
const loadPuzzles = async () => {
  try {
    loading.value = true
    const [puzzleData, leaderboardData, userSubmissionData] = await Promise.all([
      api.query('puzzle_admin', 'getActivePuzzles', {
        difficulty: selectedDifficulty.value || undefined,
        theme: selectedTheme.value || undefined,
        limit: 20
      }),
      api.query('puzzle_admin', 'getPuzzleLeaderboard', { limit: 10 }),
      user.value ? api.query('puzzle_admin', 'getUserSubmissions', { 
        userId: user.value.id,
        limit: 100 
      }) : []
    ])
    
    // Filter out already solved puzzles
    const solvedPuzzleIds = new Set(userSubmissionData.map((sub: any) => sub.puzzleId))
    const unsolvedPuzzles = puzzleData.filter((puzzle: any) => !solvedPuzzleIds.has(puzzle._id))
    
    puzzles.value = unsolvedPuzzles
    leaderboard.value = leaderboardData
    userSubmissions.value = userSubmissionData
    
    if (puzzles.value.length > 0) {
      currentPuzzleIndex.value = 0
      loadCurrentPuzzle()
    } else {
      currentPuzzle.value = null
    }
  } catch (error) {
    console.error('Error loading puzzles:', error)
  } finally {
    loading.value = false
  }
}

const loadCurrentPuzzle = () => {
  if (puzzles.value.length === 0) return
  
  currentPuzzle.value = puzzles.value[currentPuzzleIndex.value] || null
  if (currentPuzzle.value) {
    updateBoardFromFen(currentPuzzle.value.fen)
    resetPuzzleState()
    startTimer()
  }
}

const updateBoardFromFen = (fen: string) => {
  try {
    const fenParts = fen.split(' ')
    const position = fenParts[0]
    if (!position) return
    
    const rows = position.split('/')
    
    boardPosition.value = rows.map(row => {
      const squares: string[] = []
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          for (let i = 0; i < parseInt(char); i++) {
            squares.push('')
          }
        } else {
          squares.push(char)
        }
      }
      return squares
    })
  } catch (error) {
    console.error('Invalid FEN:', error)
  }
}

const getPieceSymbol = (piece: string) => {
  const symbols: { [key: string]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  }
  return symbols[piece] || ''
}

const getPieceColor = (piece: string) => {
  if (!piece) return ''
  return piece === piece.toUpperCase() ? 'text-white' : 'text-black'
}

const getDifficultyColor = (difficulty: string) => {
  const colors: { [key: string]: string } = {
    beginner: 'bg-green-900 text-green-300',
    intermediate: 'bg-yellow-900 text-yellow-300',
    advanced: 'bg-orange-900 text-orange-300',
    expert: 'bg-red-900 text-red-300'
  }
  return colors[difficulty] || 'bg-gray-900 text-gray-300'
}

const startTimer = () => {
  startTime.value = Date.now()
  elapsedTime.value = 0
  
  if (timer.value) clearInterval(timer.value)
  
  timer.value = setInterval(() => {
    elapsedTime.value = Date.now() - startTime.value
  }, 100) as any
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const submitSolution = async () => {
  if (!userSolution.value.trim() || !currentPuzzle.value || !user.value) return
  
  try {
    submitting.value = true
    stopTimer()
    
    const result = await api.mutation('puzzle_admin', 'submitSolution', {
      puzzleId: currentPuzzle.value._id,
      userId: user.value.id,
      solution: userSolution.value.trim(),
      timeSpent: elapsedTime.value
    })
    
    lastResult.value = result
    submitted.value = true
    
    // Reload user submissions to update points
    if (user.value) {
      userSubmissions.value = await api.query('puzzle_admin', 'getUserSubmissions', { 
        userId: user.value.id,
        limit: 100 
      })
    }
  } catch (error) {
    console.error('Error submitting solution:', error)
    alert('Error submitting solution. Please try again.')
    startTimer() // Restart timer on error
  } finally {
    submitting.value = false
  }
}

const nextPuzzle = () => {
  currentPuzzleIndex.value = (currentPuzzleIndex.value + 1) % puzzles.value.length
  loadCurrentPuzzle()
}

const skipPuzzle = () => {
  nextPuzzle()
}

const resetPuzzleState = () => {
  userSolution.value = ''
  submitted.value = false
  submitting.value = false
  lastResult.value = null
}

const resetFilters = () => {
  selectedDifficulty.value = ''
  selectedTheme.value = ''
  loadPuzzles()
}

// Lifecycle
onMounted(() => {
  loadPuzzles()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.chess-board {
  display: inline-block;
  border: 2px solid #374151;
}
</style>
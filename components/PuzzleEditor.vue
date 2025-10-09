<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b border-gray-700">
        <h2 class="text-2xl font-bold text-white">
          {{ puzzle ? 'Edit Puzzle' : 'Create New Puzzle' }}
        </h2>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-200 text-2xl"
        >
          ×
        </button>
      </div>

      <!-- Form Content -->
      <div class="p-6">
        <form @submit.prevent="savePuzzle">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Puzzle Title *
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter puzzle title..."
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the puzzle..."
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty *
                  </label>
                  <select
                    v-model="form.difficulty"
                    required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    Points *
                  </label>
                  <input
                    v-model.number="form.points"
                    type="number"
                    min="1"
                    max="100"
                    required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">
                  Theme/Category
                </label>
                <input
                  v-model="form.theme"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., mate_in_2, fork, pin, tactics"
                />
              </div>

              <div class="flex items-center">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  id="isActive"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="isActive" class="ml-2 block text-sm text-gray-300">
                  Make puzzle active immediately
                </label>
              </div>
            </div>

            <!-- Chess Board Setup -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Chess Position Setup
              </label>
              <div class="bg-gray-700 rounded-lg p-4">
                <!-- Mini Chess Board for Position Setup -->
                <div class="chess-board-mini mb-4">
                  <div 
                    v-for="(row, rowIndex) in boardPosition" 
                    :key="rowIndex"
                    class="flex"
                  >
                    <div
                      v-for="(square, colIndex) in row"
                      :key="colIndex"
                      :class="[
                        'w-8 h-8 flex items-center justify-center text-lg cursor-pointer border border-gray-600',
                        (rowIndex + colIndex) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-700'
                      ]"
                      @click="selectSquare(rowIndex, colIndex)"
                    >
                      <span :class="getPieceColor(square)">{{ getPieceSymbol(square) }}</span>
                    </div>
                  </div>
                </div>

                <!-- FEN Input -->
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">
                    FEN Position *
                  </label>
                  <input
                    v-model="form.fen"
                    type="text"
                    required
                    class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm font-mono"
                    placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                    @input="updateBoardFromFen"
                  />
                  <p class="text-xs text-gray-400 mt-1">
                    Enter the starting position in FEN notation
                  </p>
                </div>

                <!-- Quick Setup Buttons -->
                <div class="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    @click="setStartingPosition"
                    class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  >
                    Starting Position
                  </button>
                  <button
                    type="button"
                    @click="clearBoard"
                    class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                  >
                    Clear Board
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Solution Input -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Solution (Move Sequence) *
            </label>
            <textarea
              v-model="form.solution"
              rows="3"
              required
              class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="Enter the correct move sequence in algebraic notation (e.g., Nf3 d6 Bb5+)"
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">
              Use standard algebraic notation. Separate moves with spaces.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!isFormValid"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {{ puzzle ? 'Update Puzzle' : 'Create Puzzle' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Props and Emits
const props = defineProps<{
  puzzle?: any
}>()

const emit = defineEmits<{
  close: []
  save: [puzzleData: any]
}>()

// Form data
const form = ref({
  title: '',
  description: '',
  difficulty: 'beginner',
  theme: '',
  points: 10,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  solution: '',
  isActive: true
})

// Chess board representation
const boardPosition = ref<string[][]>([])

// Initialize empty board
const initializeBoard = () => {
  boardPosition.value = Array(8).fill(null).map(() => Array(8).fill(''))
}

// Convert FEN to board representation
const updateBoardFromFen = () => {
  try {
    const fenParts = form.value.fen.split(' ')
    const position = fenParts[0]
    if (!position) return
    
    const rows = position.split('/')
    
    boardPosition.value = rows.map(row => {
      const squares: string[] = []
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          // Empty squares
          for (let i = 0; i < parseInt(char); i++) {
            squares.push('')
          }
        } else {
          // Piece
          squares.push(char)
        }
      }
      return squares
    })
  } catch (error) {
    console.error('Invalid FEN:', error)
  }
}

// Get piece symbol for display
const getPieceSymbol = (piece: string) => {
  const symbols: { [key: string]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  }
  return symbols[piece] || ''
}

// Get piece color class
const getPieceColor = (piece: string) => {
  if (!piece) return ''
  return piece === piece.toUpperCase() ? 'text-white' : 'text-black'
}

// Quick setup functions
const setStartingPosition = () => {
  form.value.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  updateBoardFromFen()
}

const clearBoard = () => {
  form.value.fen = '8/8/8/8/8/8/8/8 w - - 0 1'
  updateBoardFromFen()
}

const selectSquare = (row: number, col: number) => {
  // For now, just a placeholder - could add piece selection UI later
  console.log(`Selected square: ${String.fromCharCode(97 + col)}${8 - row}`)
}

// Form validation
const isFormValid = computed(() => {
  return form.value.title.trim() && 
         form.value.fen.trim() && 
         form.value.solution.trim() &&
         form.value.points > 0
})

// Save puzzle
const savePuzzle = () => {
  if (!isFormValid.value) return
  
  const puzzleData = {
    title: form.value.title.trim(),
    description: form.value.description.trim() || undefined,
    difficulty: form.value.difficulty,
    theme: form.value.theme.trim() || undefined,
    points: form.value.points,
    fen: form.value.fen.trim(),
    solution: form.value.solution.trim(),
    isActive: form.value.isActive
  }
  
  emit('save', puzzleData)
}

// Watch FEN changes
watch(() => form.value.fen, updateBoardFromFen)

// Initialize component
onMounted(() => {
  // If editing existing puzzle, populate form
  if (props.puzzle) {
    form.value = {
      title: props.puzzle.title || '',
      description: props.puzzle.description || '',
      difficulty: props.puzzle.difficulty || 'beginner',
      theme: props.puzzle.theme || '',
      points: props.puzzle.points || 10,
      fen: props.puzzle.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: props.puzzle.solution || '',
      isActive: props.puzzle.isActive !== undefined ? props.puzzle.isActive : true
    }
  }
  
  initializeBoard()
  updateBoardFromFen()
})
</script>

<style scoped>
.chess-board-mini {
  display: inline-block;
  border: 2px solid #374151;
}
</style>
<template>
  <div class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-glass backdrop-blur-xl">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></div>
        <span class="text-slate-600">Loading game...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-4xl mb-3">❌</div>
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Game Not Found -->
    <div v-else-if="!gameDetails" class="text-center py-12">
      <div class="text-4xl mb-3">🔍</div>
      <p class="text-slate-600">Game not found</p>
    </div>

    <!-- Game Analysis View -->
    <div v-else class="space-y-4">
      <!-- Game Info Header -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-slate-900">Game Analysis</h2>
        <span 
          class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          :class="resultBadgeClass"
        >
          {{ resultText }}
        </span>
      </div>

      <!-- Player Info Bar -->
      <div class="grid grid-cols-3 gap-4 rounded-2xl bg-gradient-to-br from-amber-50 to-blue-50 p-4 border border-white/70">
        <!-- White Player -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow">
            <span class="text-xl">♔</span>
          </div>
          <div>
            <p class="font-semibold text-slate-900 text-sm">{{ gameDetails.white.displayName || gameDetails.white.name }}</p>
            <p class="text-xs text-slate-500">{{ gameDetails.white.eloRating }} ELO</p>
          </div>
        </div>

        <!-- VS / Result -->
        <div class="flex items-center justify-center">
          <span class="text-lg font-bold text-[#021d94]">VS</span>
        </div>

        <!-- Black Player -->
        <div class="flex items-center justify-end gap-3">
          <div class="text-right">
            <p class="font-semibold text-slate-900 text-sm">{{ gameDetails.black.displayName || gameDetails.black.name }}</p>
            <p class="text-xs text-slate-500">{{ gameDetails.black.eloRating }} ELO</p>
          </div>
          <div class="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow">
            <span class="text-xl text-white">♚</span>
          </div>
        </div>
      </div>

      <!-- Main Content: Board + Move History -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Chess Board -->
        <div class="lg:col-span-2">
          <div class="rounded-3xl border-4 border-white/70 bg-gradient-to-br from-amber-50 to-blue-50 p-4 md:p-6 shadow-inner">
            <div class="aspect-square w-full max-w-lg mx-auto">
              <!-- Board with coordinates -->
              <div class="relative">
                <!-- File labels (A-H) at top -->
                <div class="flex mb-1">
                  <div class="w-6"></div>
                  <div class="flex-1 grid grid-cols-8 gap-0">
                    <span 
                      v-for="file in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']" 
                      :key="file" 
                      class="text-center text-xs font-bold text-[#021d94] flex items-center justify-center"
                    >
                      {{ file }}
                    </span>
                  </div>
                  <div class="w-6"></div>
                </div>
                
                <div class="flex gap-1">
                  <!-- Rank labels (8-1) on left -->
                  <div class="flex flex-col justify-between w-6">
                    <span 
                      v-for="rank in [8, 7, 6, 5, 4, 3, 2, 1]" 
                      :key="rank" 
                      class="flex items-center justify-center text-xs font-bold text-[#021d94] aspect-square"
                    >
                      {{ rank }}
                    </span>
                  </div>
                  
                  <!-- Chess board -->
                  <div class="flex-1 overflow-hidden shadow-xl border-4 border-[#021d94]/30 rounded">
                    <div class="grid grid-cols-8 gap-0 h-full w-full">
                      <div
                        v-for="(square, index) in boardSquares"
                        :key="index"
                        :class="[
                          'aspect-square flex items-center justify-center relative',
                          getSquareColor(square.file, square.rank),
                          square.isLastMove ? 'ring-2 ring-[#ffaa00] ring-inset' : ''
                        ]"
                      >
                        <!-- Chess piece -->
                        <span 
                          v-if="square.piece" 
                          :class="['select-none font-bold text-3xl md:text-4xl lg:text-5xl leading-none']"
                          :style="square.piece.color === 'w'
                            ? 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; paint-order: stroke fill; -webkit-text-stroke: 1.5px rgba(0,0,0,0.8); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));' 
                            : 'color: #1e293b !important; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.3));'"
                        >
                          {{ getPieceSymbol(square.piece.type, square.piece.color) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Rank labels (8-1) on right -->
                  <div class="flex flex-col justify-between w-6">
                    <span 
                      v-for="rank in [8, 7, 6, 5, 4, 3, 2, 1]" 
                      :key="rank + '-right'" 
                      class="flex items-center justify-center text-xs font-bold text-[#021d94] aspect-square"
                    >
                      {{ rank }}
                    </span>
                  </div>
                </div>
                
                <!-- File labels (A-H) at bottom -->
                <div class="flex mt-1">
                  <div class="w-6"></div>
                  <div class="flex-1 grid grid-cols-8 gap-0">
                    <span 
                      v-for="file in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']" 
                      :key="file + '-bottom'" 
                      class="text-center text-xs font-bold text-[#021d94] flex items-center justify-center"
                    >
                      {{ file }}
                    </span>
                  </div>
                  <div class="w-6"></div>
                </div>
              </div>
            </div>

            <!-- Navigation Controls -->
            <div class="mt-4 flex items-center justify-center gap-2">
              <button
                @click="goToStart"
                :disabled="currentMoveIndex === -1"
                class="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go to start"
              >
                <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                @click="previousMove"
                :disabled="currentMoveIndex === -1"
                class="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous move"
              >
                <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <!-- Move counter -->
              <div class="px-4 py-2 rounded-lg bg-white/60 text-sm font-medium text-[#021d94]">
                {{ currentMoveIndex + 1 }} / {{ gameDetails.moveHistory.length }}
              </div>
              
              <button
                @click="nextMove"
                :disabled="currentMoveIndex >= gameDetails.moveHistory.length - 1"
                class="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next move"
              >
                <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                @click="goToEnd"
                :disabled="currentMoveIndex >= gameDetails.moveHistory.length - 1"
                class="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go to end"
              >
                <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Move History Panel -->
        <div class="lg:col-span-1">
          <div class="rounded-3xl border border-white/70 bg-gradient-to-br from-amber-50 to-blue-50 p-4 shadow-inner h-full">
            <h4 class="text-sm font-semibold text-[#021d94] mb-3">Moves</h4>
            
            <!-- Scrollable Move History -->
            <div class="overflow-y-auto" style="max-height: 400px;">
              <div class="space-y-1">
                <!-- Group moves in pairs (white and black) -->
                <div 
                  v-for="moveNumber in Math.ceil(gameDetails.moveHistory.length / 2)" 
                  :key="moveNumber"
                  class="flex items-center gap-2 text-sm"
                >
                  <!-- Move number -->
                  <span class="font-semibold text-[#021d94] w-8 flex-shrink-0">
                    {{ moveNumber }}.
                  </span>
                  
                  <!-- White's move -->
                  <span 
                    @click="goToMove((moveNumber - 1) * 2)"
                    :class="[
                      'font-medium text-slate-700 px-3 py-1 rounded flex-1 cursor-pointer transition',
                      currentMoveIndex === (moveNumber - 1) * 2 
                        ? 'bg-[#021d94] text-white' 
                        : 'bg-white/60 hover:bg-white/80'
                    ]"
                  >
                    {{ gameDetails.moveHistory[(moveNumber - 1) * 2] }}
                  </span>
                  
                  <!-- Black's move (if exists) -->
                  <span 
                    v-if="(moveNumber - 1) * 2 + 1 < gameDetails.moveHistory.length"
                    @click="goToMove((moveNumber - 1) * 2 + 1)"
                    :class="[
                      'font-medium text-slate-700 px-3 py-1 rounded flex-1 cursor-pointer transition',
                      currentMoveIndex === (moveNumber - 1) * 2 + 1
                        ? 'bg-[#021d94] text-white'
                        : 'bg-white/60 hover:bg-white/80'
                    ]"
                  >
                    {{ gameDetails.moveHistory[(moveNumber - 1) * 2 + 1] }}
                  </span>
                  <span v-else class="flex-1"></span>
                </div>
              </div>
            </div>

            <!-- Game Info -->
            <div class="mt-4 pt-4 border-t border-white/50 space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Game Mode</span>
                <span class="font-medium text-slate-700">{{ gameDetails.gameMode }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Played</span>
                <span class="font-medium text-slate-700">{{ formatDate(gameDetails.gameCreationTime) }}</span>
              </div>
              <div v-if="gameDetails.result" class="flex justify-between text-xs">
                <span class="text-slate-500">Result</span>
                <span class="font-medium text-slate-700 capitalize">{{ gameDetails.result }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Chess } from 'chess.js'
import { useNuxtApp } from '#app'
import { api } from '../convex/_generated/api'

// Types
type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

type BoardSquare = {
  file: string
  rank: number
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null
  isLastMove: boolean
}

interface GameDetails {
  gameId: string
  whiteId: string
  blackId: string
  status: 'waiting' | 'active' | 'finished'
  winner: string | null
  result: string | null
  endReason: string | null
  moveHistory: string[]
  fen: string
  currentTurn: 'white' | 'black'
  gameMode: string
  gameCreationTime: number
  lastMoveTime: number
  timeControl: { baseTimeMs: number; incrementMs: number; type: string } | null
  whiteTimeMs: number | null
  blackTimeMs: number | null
  white: {
    id: string
    name: string
    displayName: string | null
    eloRating: number
    picture: string | null
  }
  black: {
    id: string
    name: string
    displayName: string | null
    eloRating: number
    picture: string | null
  }
}

// Props
const props = defineProps<{
  gameId: string
}>()

// State
const { $convex } = useNuxtApp()
const loading = ref(true)
const error = ref<string | null>(null)
const gameDetails = ref<GameDetails | null>(null)
const currentMoveIndex = ref(-1)
const chess = ref<Chess>(new Chess())
const lastMoveSquares = ref<{ from: string; to: string } | null>(null)

// Fetch game details
const fetchGameDetails = async () => {
  if (!props.gameId) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = null
  
  try {
    const result = await $convex.query(api.games.getGameDetails, { gameId: props.gameId })
    gameDetails.value = result
    
    if (result) {
      // Initialize chess instance and go to the end position
      chess.value = new Chess()
      currentMoveIndex.value = -1
      goToEnd()
    }
  } catch (err: any) {
    console.error('Failed to fetch game details:', err)
    error.value = err?.message || 'Failed to load game'
  } finally {
    loading.value = false
  }
}

// Computed properties
const resultText = computed(() => {
  if (!gameDetails.value) return ''
  
  const { winner, result, white, black } = gameDetails.value
  
  if (winner === 'draw' || result === 'stalemate' || result === 'agreement') {
    return 'Draw'
  }
  
  if (winner === white.id || winner === 'white') {
    return 'White Wins'
  }
  
  if (winner === black.id || winner === 'black') {
    return 'Black Wins'
  }
  
  return gameDetails.value.status === 'finished' ? 'Finished' : 'In Progress'
})

const resultBadgeClass = computed(() => {
  const text = resultText.value
  if (text.includes('White')) {
    return 'bg-amber-100 text-amber-700 border border-amber-200'
  }
  if (text.includes('Black')) {
    return 'bg-slate-700 text-white border border-slate-600'
  }
  if (text === 'Draw') {
    return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
  return 'bg-blue-100 text-blue-700 border border-blue-200'
})

const boardSquares = computed<BoardSquare[]>(() => {
  const squares: BoardSquare[] = []
  const board = chess.value.board()
  
  // Iterate from rank 8 to 1 (top to bottom for white's perspective)
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const rank = 8 - rankIndex
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const file = 'abcdefgh'.charAt(fileIndex)
      const squareName = `${file}${rank}`
      const row = board[rankIndex]
      const piece = row ? row[fileIndex] : null
      
      squares.push({
        file,
        rank,
        piece: piece ? { type: piece.type as PieceSymbol, color: piece.color } : null,
        isLastMove: lastMoveSquares.value 
          ? (squareName === lastMoveSquares.value.from || squareName === lastMoveSquares.value.to)
          : false
      })
    }
  }
  
  return squares
})

// Navigation functions
const goToStart = () => {
  chess.value = new Chess()
  currentMoveIndex.value = -1
  lastMoveSquares.value = null
}

const goToEnd = () => {
  if (!gameDetails.value) return
  
  chess.value = new Chess()
  const moves = gameDetails.value.moveHistory
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    if (move) {
      const result = chess.value.move(move)
      if (!result) {
        console.error(`Invalid move at index ${i}: ${move}`)
        break
      }
    }
  }
  
  currentMoveIndex.value = moves.length - 1
  
  // Set last move highlight by parsing the last move made
  if (moves.length > 0) {
    // Get last move info from the chess instance
    const history = chess.value.history()
    if (history.length > 0) {
      // We need to track from/to manually since history() only gives SAN
      // Reset and replay to get verbose history
      const tempChess = new Chess()
      let lastFrom = ''
      let lastTo = ''
      for (const m of moves) {
        if (m) {
          const moveResult = tempChess.move(m)
          if (moveResult) {
            lastFrom = moveResult.from
            lastTo = moveResult.to
          }
        }
      }
      if (lastFrom && lastTo) {
        lastMoveSquares.value = { from: lastFrom, to: lastTo }
      }
    }
  }
}

const previousMove = () => {
  if (currentMoveIndex.value < 0) return
  goToMove(currentMoveIndex.value - 1)
}

const nextMove = () => {
  if (!gameDetails.value) return
  if (currentMoveIndex.value >= gameDetails.value.moveHistory.length - 1) return
  goToMove(currentMoveIndex.value + 1)
}

const goToMove = (index: number) => {
  if (!gameDetails.value) return
  
  // Reset board and replay moves up to the target index
  chess.value = new Chess()
  
  if (index < 0) {
    currentMoveIndex.value = -1
    lastMoveSquares.value = null
    return
  }
  
  const moves = gameDetails.value.moveHistory
  let lastFrom = ''
  let lastTo = ''
  
  for (let i = 0; i <= index && i < moves.length; i++) {
    const move = moves[i]
    if (move) {
      const result = chess.value.move(move)
      if (!result) {
        console.error(`Invalid move at index ${i}: ${move}`)
        break
      }
      lastFrom = result.from
      lastTo = result.to
    }
  }
  
  currentMoveIndex.value = index
  
  // Set last move highlight
  if (lastFrom && lastTo) {
    lastMoveSquares.value = { from: lastFrom, to: lastTo }
  } else {
    lastMoveSquares.value = null
  }
}

// Utility functions
const getSquareColor = (file: string, rank: number) => {
  const fileIndex = 'abcdefgh'.indexOf(file)
  const isLight = (fileIndex + rank) % 2 === 1
  return isLight ? 'bg-amber-100' : 'bg-blue-400'
}

const getPieceSymbol = (type: PieceSymbol, color: 'w' | 'b') => {
  const pieces = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟︎' }
  }
  return pieces[color]?.[type] || ''
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watch for gameId changes
watch(() => props.gameId, () => {
  fetchGameDetails()
}, { immediate: true })

// Keyboard navigation
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      previousMove()
    } else if (e.key === 'ArrowRight') {
      nextMove()
    } else if (e.key === 'Home') {
      goToStart()
    } else if (e.key === 'End') {
      goToEnd()
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Import onUnmounted for cleanup
import { onUnmounted } from 'vue'
</script>

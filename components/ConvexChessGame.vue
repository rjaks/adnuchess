<template>
  <div class="space-y-6">
    <!-- Game Loading -->
    <div v-if="!gameLoaded" class="text-center py-12">
      <div class="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-6 py-3 shadow-lg">
        <div class="h-4 w-4 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></div>
        <span class="font-medium text-[#021d94]">Loading game...</span>
      </div>
    </div>

    <!-- Game Error -->
    <div v-else-if="gameError" class="text-center py-12">
      <div class="rounded-3xl border border-red-200 bg-red-50 p-6 max-w-md mx-auto">
        <h3 class="text-lg font-semibold text-red-900">Game Error</h3>
        <p class="mt-2 text-sm text-red-700">{{ gameError }}</p>
        <button
          @click="$router.push('/matchmaking')"
          class="mt-4 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
        >
          Back to Matchmaking
        </button>
      </div>
    </div>

    <!-- Active Game -->
    <div v-else>
      <!-- Game Status Bar -->
      <div class="rounded-3xl border border-white/70 bg-white/70 p-4 mb-6 shadow-inner">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full" :class="connectionStatusClass"></div>
            <span class="text-sm font-medium text-slate-900">{{ connectionStatus }}</span>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-slate-900">
              {{ isMyTurn ? 'Your turn' : 'Opponent\'s turn' }}
            </p>
            <p class="text-xs text-slate-500">{{ gameState?.gameMode }} • {{ formatGameTime(gameTime) }}</p>
          </div>
        </div>
      </div>

      <!-- Chess Board -->
      <div class="rounded-4xl border border-white/70 bg-white/60 p-6 shadow-glass backdrop-blur-xl">
        <!-- Opponent Info -->
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-[#021d94]/10 flex items-center justify-center">
              <span class="text-sm font-bold text-[#021d94]">{{ opponentInitials }}</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ opponent?.name }}</p>
              <p class="text-xs text-slate-500">{{ opponent?.color === 'white' ? 'White' : 'Black' }} pieces</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-600">Last move: {{ gameState?.lastMove || 'None' }}</p>
          </div>
        </div>

        <!-- Chess Board Grid -->
        <div class="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-inner">
          <div class="aspect-square max-w-lg mx-auto">
            <div class="grid grid-cols-8 gap-0 h-full w-full rounded-xl overflow-hidden">
              <div
                v-for="(square, index) in boardSquares"
                :key="index"
                :class="[
                  'aspect-square flex items-center justify-center text-2xl cursor-pointer transition-all hover:bg-opacity-80',
                  getSquareColor(square.file, square.rank),
                  square.isSelected ? 'ring-4 ring-blue-500 ring-inset' : '',
                  square.isLegalMove ? 'ring-2 ring-green-400 ring-inset' : '',
                  square.isLastMove ? 'bg-yellow-200' : '',
                  !isMyTurn || gameState?.status !== 'active' ? 'cursor-not-allowed opacity-60' : ''
                ]"
                @click="handleSquareClick(square)"
              >
                <span v-if="square.piece" class="select-none drop-shadow-sm">
                  {{ getPieceSymbol(square.piece.type, square.piece.color) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Player Info -->
        <div class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-[#ffaa00]/10 flex items-center justify-center">
              <span class="text-sm font-bold text-[#ffaa00]">{{ userInitials }}</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ user?.name || 'You' }}</p>
              <p class="text-xs text-slate-500">{{ myColor === 'white' ? 'White' : 'Black' }} pieces</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-600">Moves: {{ gameState?.moveHistory?.length || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Game Info -->
      <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
        <h3 class="text-lg font-semibold text-slate-900">Game Info</h3>
        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-600">Status</span>
            <span class="font-semibold capitalize">{{ gameState?.status }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Last Move</span>
            <span class="font-semibold">{{ gameState?.lastMove || 'None' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Game Time</span>
            <span class="font-semibold">{{ formatGameTime(gameTime) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Connection</span>
            <span class="font-semibold text-green-600">Real-time (Convex)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { Chess, type PieceSymbol } from 'chess.js'
import { api } from '~/convex/_generated/api'

const props = defineProps<{
  gameId: string
}>()

type GameState = {
  _id: string
  gameId: string
  fen: string
  lastMove?: string
  lastMoveTime: number
  currentTurn: 'white' | 'black'
  player1: { id: string; name: string; color: 'white' | 'black' }
  player2: { id: string; name: string; color: 'white' | 'black' }
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  gameMode: string
  createdAt: number
  moveHistory: string[]
}

type BoardSquare = {
  file: string
  rank: number
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null
  isSelected: boolean
  isLegalMove: boolean
  isLastMove: boolean
}

const { user } = useAuth()
const { $convex } = useNuxtApp()

// Game state
const gameLoaded = ref(false)
const gameError = ref('')
const gameState = ref<GameState | null>(null)
const game = ref(new Chess())
const selectedSquare = ref<string | null>(null)
const gameTime = ref(0)

// Game timer
let gameTimer: ReturnType<typeof setInterval> | null = null

// Connection status
const connectionStatus = ref('Connecting...')
const connectionStatusClass = computed(() => {
  if (connectionStatus.value === 'Connected (Real-time)') return 'bg-green-500'
  if (connectionStatus.value === 'Connecting...') return 'bg-yellow-500 animate-pulse'
  return 'bg-red-500'
})

// Game computed properties
const myColor = computed(() => {
  if (!gameState.value || !user.value) return 'white'
  return gameState.value.player1.id === user.value.id 
    ? gameState.value.player1.color 
    : gameState.value.player2.color
})

const opponent = computed(() => {
  if (!gameState.value || !user.value) return null
  return gameState.value.player1.id === user.value.id 
    ? gameState.value.player2 
    : gameState.value.player1
})

const isMyTurn = computed(() => {
  return gameState.value?.currentTurn === myColor.value
})

const userInitials = computed(() => {
  if (!user.value) return 'You'
  const name = user.value.name || user.value.email
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const opponentInitials = computed(() => {
  if (!opponent.value) return 'OP'
  return opponent.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Board representation
const boardSquares = computed((): BoardSquare[] => {
  const squares: BoardSquare[] = []
  const board = game.value.board()
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = myColor.value === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  
  for (let rank of ranks) {
    for (let file of files) {
      const squareName = `${file}${rank}`
      const piece = board[rank - 1][files.indexOf(file)]
      
      squares.push({
        file,
        rank,
        piece,
        isSelected: selectedSquare.value === squareName,
        isLegalMove: false, // TODO: Calculate legal moves
        isLastMove: gameState.value?.lastMove === squareName
      })
    }
  }
  
  return squares
})

// Watch for real-time game updates
const gameQuery = computed(() => {
  if (!$convex || !props.gameId) return null
  return $convex.query(api.games.getById, { gameId: props.gameId })
})

watch(gameQuery, (newGameState) => {
  if (newGameState) {
    // Update local state when Convex data changes
    updateGameState(newGameState)
    connectionStatus.value = 'Connected (Real-time)'
    gameLoaded.value = true
  }
}, { immediate: true })

// Game methods
const updateGameState = (newState: GameState) => {
  if (newState.lastMoveTime > (gameState.value?.lastMoveTime || 0)) {
    gameState.value = newState
    game.value = new Chess(newState.fen)
    selectedSquare.value = null // Clear selection after move
  }
}

const makeMove = async (move: string) => {
  if (!isMyTurn.value || !user.value) return
  
  try {
    // Optimistically update local state
    const moveResult = game.value.move(move)
    if (!moveResult) return
    
    // Send move to Convex
    await $convex.mutation(api.games.makeMove, {
      gameId: props.gameId,
      playerId: user.value.id,
      move
    })
    
    selectedSquare.value = null
  } catch (error) {
    console.error('Failed to make move:', error)
    // Revert the move
    if (gameState.value) {
      game.value = new Chess(gameState.value.fen)
    }
    gameError.value = error instanceof Error ? error.message : 'Failed to make move'
  }
}

const handleSquareClick = (square: BoardSquare) => {
  // Don't allow moves if it's not our turn or game isn't active
  if (!isMyTurn.value || gameState.value?.status !== 'active') {
    return
  }
  
  const squareName = `${square.file}${square.rank}`
  
  if (selectedSquare.value) {
    // Try to make a move
    const from = selectedSquare.value
    const to = squareName
    
    // Check if this is a valid move
    const possibleMoves = game.value.moves({ square: from, verbose: true })
    const validMove = possibleMoves.find(move => move.to === to)
    
    if (validMove) {
      makeMove(validMove.san)
    } else if (square.piece && square.piece.color === (myColor.value === 'white' ? 'w' : 'b')) {
      // Select different piece
      selectedSquare.value = squareName
    } else {
      // Invalid move, deselect
      selectedSquare.value = null
    }
  } else if (square.piece && square.piece.color === (myColor.value === 'white' ? 'w' : 'b')) {
    // Select piece
    selectedSquare.value = squareName
  }
}

const getSquareColor = (file: string, rank: number) => {
  const fileIndex = 'abcdefgh'.indexOf(file)
  const isLight = (fileIndex + rank) % 2 === 1
  return isLight ? 'bg-amber-100' : 'bg-amber-200'
}

const getPieceSymbol = (type: PieceSymbol, color: 'w' | 'b') => {
  const pieces = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  }
  return pieces[color][type]
}

const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const startGameTimer = () => {
  gameTimer = setInterval(() => {
    if (gameState.value) {
      gameTime.value = Math.floor((Date.now() - gameState.value.createdAt) / 1000)
    }
  }, 1000)
}

const stopGameTimer = () => {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

onMounted(() => {
  startGameTimer()
})

onBeforeUnmount(() => {
  stopGameTimer()
})
</script>
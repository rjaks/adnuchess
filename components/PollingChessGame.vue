// filepath: c:\Users\Adrian\Documents\github\adnuchess\components\PollingChessGame.vue
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
            <div class="h-2 w-2 rounded-full animate-pulse" :class="connectionStatusClass"></div>
            <span class="text-sm font-medium text-slate-900">{{ connectionStatus }}</span>
          </div>          <div class="text-right">
            <p class="text-sm font-semibold text-slate-900">
              {{ isMyTurn ? 'Your turn' : 'Opponent\'s turn' }}
            </p>            <p class="text-xs text-slate-500">{{ gameState?.gameMode }} • {{ formatGameTime(gameTime) }}</p>
          </div>
        </div>
      </div>      <!-- Chess Board and Move History -->
      <div class="rounded-4xl border border-white/70 bg-white/60 p-6 shadow-glass backdrop-blur-xl">        <!-- Opponent Clock (Top) -->
        <ChessClock
          v-if="gameState?.timeControl"
          :display-time="opponent?.color === 'white' ? whiteFormatted : blackFormatted"
          :status="opponent?.color === 'white' ? whiteStatus : blackStatus"
          :is-active="gameState.status === 'active' && !isMyTurn"
          :player-name="opponent?.name || 'Opponent'"
          :player-color="opponent?.color === 'white' ? 'White' : 'Black'"
          :increment="gameState.timeControl.incrementMs / 1000"
          :avatar-url="opponent?.avatarUrl"
          class="mb-4"
        />
        
        <!-- Board and Moves Side by Side -->
        <div class="flex gap-8 items-start justify-center">          <!-- Chess Board Component -->
          <ChessBoard
            :board-squares="boardSquares"
            :my-color="myColor"
            :arrows="arrows"
            :highlights="highlights"
            :review-mode="reviewMode"
            :can-interact="gameState?.status === 'active'"
            @square-click="handleSquareClick"
            @right-mouse-down="handleRightMouseDown"
            @right-mouse-up="handleRightMouseUp"
            @drag-start="handleDragStart"
            @drag-over="handleDragOver"
            @drag-end="handleDragEnd"
            @drop="handleDrop"
          />

          <!-- Move History and Game Controls Panel -->
          <div class="w-80 flex-shrink-0 space-y-4">
            <!-- Move History Component -->
            <ChessMoveHistory
              v-if="gameState?.moveHistory && gameState.moveHistory.length > 0"
              :move-history="gameState.moveHistory"
              :review-mode="reviewMode"
              :review-move-index="reviewMoveIndex"
              @go-to-move="goToMove"
              @previous-move="goToPreviousMove"
              @next-move="goToNextMove"
              @exit-review="exitReviewMode"
            />            <!-- Game Controls Component -->
            <ChessGameControls
              v-if="isGameInProgress"
              :draw-offered="drawOffered"
              :draw-offer-inbound="drawOfferInbound"
              @offer-draw="offerDraw"
              @resign="confirmResign"
            />            <!-- Chat Component -->
            <ChessGameChat
              :messages="chatMessages"
              :show-chat="showChat"
              :unread-messages="unreadMessages"
              :current-user-id="user?.id"
              @toggle-chat="toggleChat"
              @send-message="sendChatMessage"
            />
          </div>        </div>
        
        <!-- Current Player Clock (Bottom) -->
        <ChessClock
          v-if="gameState?.timeControl"
          :display-time="myColor === 'white' ? whiteFormatted : blackFormatted"
          :status="myColor === 'white' ? whiteStatus : blackStatus"
          :is-active="gameState.status === 'active' && isMyTurn"
          :player-name="user?.name || 'You'"
          :player-color="myColor === 'white' ? 'White' : 'Black'"
          :increment="gameState.timeControl.incrementMs / 1000"
          :avatar-url="gameState.player1.id === user?.id ? gameState.player1.avatarUrl : gameState.player2.avatarUrl"
          class="mt-4"
        />
      </div>
      
      <!-- Draw offer modal -->
      <div v-if="drawOfferInbound && isGameInProgress" class="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
        <div class="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold text-slate-900">Draw Offer</h3>
          <p class="mt-2 text-slate-600">Your opponent has offered a draw. Do you accept?</p>
          <div class="mt-4 flex justify-end gap-3">
            <button
              @click="respondToDrawOffer(false)"
              class="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
            >
              Decline
            </button>
            <button
              @click="respondToDrawOffer(true)"
              class="rounded-lg bg-[#021d94] px-4 py-2 text-sm font-semibold text-white hover:bg-[#021d94]/90"
            >
              Accept
            </button>
          </div>
        </div>
      </div>

      <!-- Resign confirmation modal -->
      <div v-if="showResignConfirmation" class="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
        <div class="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold text-slate-900">Confirm Resignation</h3>
          <p class="mt-2 text-slate-600">Are you sure you want to resign this game? This action cannot be undone.</p>
          <div class="mt-4 flex justify-end gap-3">
            <button
              @click="showResignConfirmation = false"
              class="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              @click="resignGame"
              class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Resign
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useChessClock } from '~/composables/useChessClock'
import { Chess } from 'chess.js'
import { api } from '~/convex/_generated/api'

// Define Chess.js types since they're not exported properly
type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
type Square = string // a1, a2, etc.
type Move = {
  color: 'w' | 'b'
  from: Square
  to: Square
  piece: PieceSymbol
  san: string
  // Other properties that may be needed
}

const props = defineProps<{
  gameId: string
}>()

type GameState = {
  id: string
  fen: string
  lastMove: string | null
  lastMoveTime: number
  currentTurn: 'white' | 'black'
  player1: { id: string; name: string; color: 'white' | 'black'; avatarUrl?: string }
  player2: { id: string; name: string; color: 'white' | 'black'; avatarUrl?: string }
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  gameMode: string
  createdAt: number
  moveHistory: string[]
  // Timer fields
  whiteTimeMs?: number
  blackTimeMs?: number
  timeControl?: {
    baseTimeMs: number
    incrementMs: number
    type: 'bullet' | 'blitz' | 'rapid' | 'classical'
  }
  lastMoveTimestamp?: number
  gameStartTimestamp?: number
  timeoutWinner?: 'white' | 'black' | null
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

// Game state
const gameLoaded = ref(false)
const gameError = ref('')
const gameState = ref<GameState | null>(null)
const game = ref(new Chess())
const selectedSquare = ref<string | null>(null)
const legalMovesCache = ref<Set<string>>(new Set())
const gameTime = ref(0)
const lastPolledTime = ref(0)
const reviewMode = ref(false)
const reviewMoveIndex = ref<number | null>(null)

// Drag and drop state
const draggedSquare = ref<string | null>(null)
const draggedPiece = ref<{ type: PieceSymbol; color: 'w' | 'b' } | null>(null)

// Drawing arrows and highlights state
type ArrowColor = 'green' | 'red' | 'yellow' | 'blue'
type Arrow = { from: string; to: string; color: ArrowColor }
type Highlight = { square: string; color: ArrowColor }

const arrows = ref<Arrow[]>([])
const highlights = ref<Highlight[]>([])
const drawingArrow = ref<{ from: string; color: ArrowColor } | null>(null)
const isRightMouseDown = ref(false)

// Chat state
const chatMessages = ref<any[]>([])
const showChat = ref(false)
const unreadMessages = ref(0)

// Timer and subscription
let gameTimer: ReturnType<typeof setInterval> | null = null
let unsubscribe: (() => void) | null = null
let chatUnsubscribe: (() => void) | null = null

// Chess Clock Composable
const clockState = computed(() => {
  if (!gameState.value || !gameState.value.timeControl) return null
  
  // Use actual server values, only fallback for initial state
  const whiteTime = gameState.value.whiteTimeMs !== undefined 
    ? gameState.value.whiteTimeMs 
    : gameState.value.timeControl.baseTimeMs
  
  const blackTime = gameState.value.blackTimeMs !== undefined 
    ? gameState.value.blackTimeMs 
    : gameState.value.timeControl.baseTimeMs
  
  console.log('[Clock] Timer state:', {
    whiteTimeMs: whiteTime,
    blackTimeMs: blackTime,
    lastMoveTimestamp: gameState.value.lastMoveTimestamp,
    gameStartTimestamp: gameState.value.gameStartTimestamp
  })
  
  return {
    whiteTimeMs: whiteTime,
    blackTimeMs: blackTime,
    currentTurn: gameState.value.currentTurn,
    lastMoveTimestamp: gameState.value.lastMoveTimestamp ?? gameState.value.gameStartTimestamp ?? gameState.value.createdAt,
    gameStartTimestamp: gameState.value.gameStartTimestamp ?? gameState.value.createdAt,
    isGameActive: gameState.value.status === 'active'
  }
})

const { 
  whiteFormatted, 
  blackFormatted, 
  whiteStatus, 
  blackStatus 
} = useChessClock(clockState)

// Connection status
const connectionStatus = ref('Connecting...')
const connectionStatusClass = computed(() => {
  if (connectionStatus.value === 'Connected') return 'bg-green-500'
  if (connectionStatus.value === 'Loading...') return 'bg-blue-500'
  return 'bg-yellow-500'
})

// Game computed properties
const myColor = computed(() => {
  if (!gameState.value || !user.value) return 'white'
  
  // Check if I'm player1 or player2
  if (gameState.value.player1.id === user.value.id) {
    return gameState.value.player1.color 
  } else if (gameState.value.player2.id === user.value.id) {
    return gameState.value.player2.color
  }
  
  // Fallback to observer mode
  return 'white'
})

const opponent = computed(() => {
  if (!gameState.value || !user.value) return null
  
  if (gameState.value.player1.id === user.value.id) {
    return gameState.value.player2 
  } else {
    return gameState.value.player1
  }
})

const isMyTurn = computed(() => {
  if (!gameState.value || !user.value) return false
  
  const currentTurn = gameState.value.currentTurn // 'white' or 'black'
  const myColorValue = myColor.value // 'white' or 'black'
  
  // More detailed debug logs
  console.log(`----- TURN DEBUG INFO -----`)
  console.log(`User ID: ${user.value.id}`)
  console.log(`Player1 ID: ${gameState.value.player1.id}, Color: ${gameState.value.player1.color}`)
  console.log(`Player2 ID: ${gameState.value.player2.id}, Color: ${gameState.value.player2.color}`)
  console.log(`Current turn: ${currentTurn}, My color: ${myColorValue}`)
  console.log(`Is my turn: ${currentTurn === myColorValue}`)
  console.log(`--------------------------`)
  
  return currentTurn === myColorValue
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

// Watch selectedSquare and update cache immediately
watch(selectedSquare, (newSquare) => {
  const cacheStart = performance.now()
  legalMovesCache.value.clear()
  
  if (newSquare) {
    try {
      const movesVerbose = game.value.moves({
        square: newSquare as Square,
        verbose: true
      })
      
      if (movesVerbose.length > 0 && typeof movesVerbose[0] === 'object') {
        (movesVerbose as any[]).forEach(move => {
          legalMovesCache.value.add(move.to)
        })
      }
      
      console.log(`[PERF] Legal moves cache updated for ${newSquare}: ${legalMovesCache.value.size} moves in ${(performance.now() - cacheStart).toFixed(2)}ms`)
    } catch (error) {
      console.error('Error calculating legal moves:', error)
    }
  }
}, { immediate: true })

// Board representation
const boardSquares = computed((): BoardSquare[] => {
  const computeStart = performance.now()
  const squares: BoardSquare[] = []
  
  // Use review board if in review mode, otherwise use current game
  const currentGame = reviewMode.value && reviewMoveIndex.value !== null 
    ? getGameAtMove(reviewMoveIndex.value) 
    : game.value
  
  const board = currentGame.board()
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = myColor.value === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  
  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
    const rank = ranks[rankIndex]
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex]
      if (rank !== undefined && file !== undefined) {        const boardRank = 8 - rank
        const boardFile = fileIndex
        const piece = board[boardRank] ? board[boardRank][boardFile] : null
        const squareName = `${file}${rank}`
        
        // Disable legal moves in review mode
        const isLegalMove = !reviewMode.value && selectedSquare.value ? legalMovesCache.value.has(squareName) : false
        
        squares.push({
          file,
          rank,
          piece,
          isSelected: !reviewMode.value && selectedSquare.value === squareName,
          isLegalMove,
          isLastMove: !reviewMode.value && gameState.value?.lastMove === squareName
        } as any)
      }
    }
  }
  
  const computeTime = performance.now() - computeStart
  if (computeTime > 5) {
    console.log(`[PERF] boardSquares computed in ${computeTime.toFixed(2)}ms`)
  }
  
  return squares
})

// Game methods
const loadGameState = async () => {
  try {
    connectionStatus.value = 'Loading...'
    const { $convex } = useNuxtApp()
    
    const response = await $convex.query(api.chess_games.getGameById, { gameId: props.gameId })
    
    if (response) {
      // Fetch player avatars from profiles
      const player1Profile = await $convex.query(api.profiles.getByUserId, { userId: response.player1.id })
      const player2Profile = await $convex.query(api.profiles.getByUserId, { userId: response.player2.id })
      
      gameState.value = {
        id: response.gameId,
        fen: response.fen,
        lastMove: response.lastMove || null,
        lastMoveTime: response.lastMoveTime,
        currentTurn: response.currentTurn,
        player1: {
          ...response.player1,
          avatarUrl: player1Profile?.picture
        },
        player2: {
          ...response.player2,
          avatarUrl: player2Profile?.picture
        },
        status: response.status,
        winner: response.winner,
        gameMode: response.gameMode,
        createdAt: response.createdAt,
        moveHistory: response.moveHistory,
        // Timer fields
        whiteTimeMs: response.whiteTimeMs,
        blackTimeMs: response.blackTimeMs,
        timeControl: response.timeControl,
        lastMoveTimestamp: response.lastMoveTimestamp,
        gameStartTimestamp: response.gameStartTimestamp,
        timeoutWinner: response.timeoutWinner
      }
      game.value = new Chess(response.fen)
      lastPolledTime.value = response.lastMoveTime
    }
    
    connectionStatus.value = 'Connected'
    gameLoaded.value = true
  } catch (error: any) {
    console.error('Failed to load game state:', error)
    gameError.value = typeof error === 'string' ? error : error.message || 'Failed to load game'
    connectionStatus.value = 'Error'
  }
}

// FIXED VERSION: Using direct string reference to API function instead of api object
const makeMove = async (fromSquare: string, toSquare: string) => {
  if (!isMyTurn.value || !user.value) {
    console.log(`Cannot make move - isMyTurn: ${isMyTurn.value}, user: ${user.value?.id}`)
    return
  }
  
  try {
    // Prevent multiple move submissions
    connectionStatus.value = 'Moving...'
    
    console.log(`Making move from ${fromSquare} to ${toSquare}`)
    console.log(`Current FEN before move: ${game.value.fen()}`)
    
    // Generate move object locally first to validate
    const moveObj = game.value.move({
      from: fromSquare as Square,
      to: toSquare as Square,
      promotion: 'q' // Default to queen promotion
    })
    
    if (!moveObj) {
      console.error('Invalid move according to chess.js')
      connectionStatus.value = 'Connected'
      return
    }
    
    console.log(`Local move validation passed: ${moveObj.san}`)
    
    const { $convex } = useNuxtApp()
    
    // Make the move in Convex - use string reference instead of api object
    console.log('Sending move to Convex:', {
      gameId: props.gameId,
      move: moveObj.san,
      playerId: user.value.id    })
    
    // Use chess_games:makeMove which has timer support
    try {
      const result = await $convex.mutation('chess_games:makeMove', {
        gameId: props.gameId,
        move: moveObj.san,
        playerId: user.value.id
      })
      
      console.log('Move successfully registered in Convex:', result)
      
      // Reset selection and update status
      selectedSquare.value = null
      connectionStatus.value = 'Connected'
      
      // Note: No need to update game state here as the subscription will handle it
    } catch (convexError) {
      // If string reference fails, try with the API object
      console.warn('String reference failed, trying with API object:', convexError)
      
      const result = await $convex.mutation(api.chess_games.makeMove, {
        gameId: props.gameId,
        move: moveObj.san,
        playerId: user.value.id
      })
      
      console.log('Move registered via API object:', result)
      selectedSquare.value = null
      connectionStatus.value = 'Connected'
    }
  } catch (error) {
    console.error('Failed to make move:', error)
    
    // Show error status
    connectionStatus.value = 'Error'
    gameError.value = 'Failed to make move: ' + (error instanceof Error ? error.message : String(error))
    
    // Revert the move locally
    try {
      game.value.undo()
    } catch (e) {
      console.error('Failed to undo move:', e)
    }
    
    // Reset selection
    selectedSquare.value = null
    
    // Reset status after a delay
    setTimeout(() => {
      connectionStatus.value = 'Connected'
      gameError.value = ''
    }, 3000)
  }
}

const handleSquareClick = (square: BoardSquare) => {
  // Clear arrows and highlights on left click
  clearAllDrawings()
  
  // Don't allow moves in review mode
  if (reviewMode.value) {
    console.log(`[PERF] Click ignored - in review mode`)
    return
  }
  
  const clickStart = performance.now()
  console.log(`[PERF] Click started on ${square.file}${square.rank}`)
  
  const squareName = `${square.file}${square.rank}`
  
  // If it's my turn, handle normal move
  if (isMyTurn.value && gameState.value?.status === 'active') {
    if (selectedSquare.value) {
      // Try to make a move
      const from = selectedSquare.value
      const to = squareName
      
      if (square.isLegalMove) {
        console.log(`[PERF] Making move took: ${(performance.now() - clickStart).toFixed(2)}ms`)
        makeMove(from, to)
      } else if (square.piece && square.piece.color === (myColor.value === 'white' ? 'w' : 'b')) {
        // Select different piece
        selectedSquare.value = squareName
        console.log(`[PERF] Re-selection took: ${(performance.now() - clickStart).toFixed(2)}ms`)
      } else {
        // Invalid move, deselect
        selectedSquare.value = null
        console.log(`[PERF] Deselect took: ${(performance.now() - clickStart).toFixed(2)}ms`)
      }    } else if (square.piece && square.piece.color === (myColor.value === 'white' ? 'w' : 'b')) {
      // Select piece
      selectedSquare.value = squareName
      console.log(`[PERF] Selection took: ${(performance.now() - clickStart).toFixed(2)}ms`)
    }
  }
}

// Helper functions moved to ChessBoard component

const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Review mode functions
const getGameAtMove = (moveIndex: number) => {
  const reviewGame = new Chess()
  
  if (!gameState.value?.moveHistory) return reviewGame
  
  // Play moves up to the selected index
  for (let i = 0; i <= moveIndex; i++) {
    const move = gameState.value.moveHistory[i]
    if (move) {
      try {
        reviewGame.move(move)
      } catch (error) {
        console.error(`Error playing move ${i}: ${move}`, error)
        break
      }
    }
  }
  
  return reviewGame
}

const goToPreviousMove = () => {
  if (!gameState.value?.moveHistory || gameState.value.moveHistory.length === 0) return
  
  if (!reviewMode.value) {
    // Enter review mode at the last move
    reviewMode.value = true
    reviewMoveIndex.value = gameState.value.moveHistory.length - 2
  } else if (reviewMoveIndex.value !== null && reviewMoveIndex.value > -1) {
    reviewMoveIndex.value--
  }
}

const goToNextMove = () => {
  if (!gameState.value?.moveHistory || !reviewMode.value || reviewMoveIndex.value === null) return
  
  if (reviewMoveIndex.value < gameState.value.moveHistory.length - 1) {
    reviewMoveIndex.value++
  } else {
    // Exit review mode if we're at the latest move
    exitReviewMode()
  }
}

const exitReviewMode = () => {
  reviewMode.value = false
  reviewMoveIndex.value = null
}

const goToMove = (moveIndex: number) => {
  if (!gameState.value?.moveHistory) return
  reviewMode.value = true
  reviewMoveIndex.value = moveIndex
}

// Drawing arrows and highlights helper functions
const getSquareCenter = (square: string): { x: number; y: number} => {
  const file = square[0]
  const rank = parseInt(square[1] || '1')
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const fileIndex = files.indexOf(file || 'a')
  
  // Adjust based on board orientation
  let x, y
  if (myColor.value === 'white') {
    x = (fileIndex + 0.5) * 12.5  // 100 / 8 = 12.5
    y = (8 - rank + 0.5) * 12.5
  } else {
    x = (7 - fileIndex + 0.5) * 12.5
    y = (rank - 0.5) * 12.5
  }
  
  return { x, y }
}

const getCurrentArrowColor = (event: MouseEvent): ArrowColor => {
  // Shift key = red, Alt key = blue, Ctrl key = yellow, default = green
  if (event.shiftKey) return 'red'
  if (event.altKey) return 'blue'
  if (event.ctrlKey) return 'yellow'
  return 'green'
}

const handleRightMouseDown = (event: MouseEvent, square: BoardSquare) => {
  event.preventDefault()
  isRightMouseDown.value = true
  
  const squareName = `${square.file}${square.rank}`
  const color = getCurrentArrowColor(event)
  
  drawingArrow.value = { from: squareName, color }
}

const handleRightMouseUp = (event: MouseEvent, square: BoardSquare) => {
  event.preventDefault()
  
  if (!isRightMouseDown.value || !drawingArrow.value) return
  
  const squareName = `${square.file}${square.rank}`
  const { from, color } = drawingArrow.value
  
  if (from === squareName) {
    // Same square - toggle highlight
    const existingIndex = highlights.value.findIndex(h => h.square === squareName && h.color === color)
    if (existingIndex >= 0) {
      highlights.value.splice(existingIndex, 1)
    } else {
      // Remove any existing highlight on this square
      const anyHighlightIndex = highlights.value.findIndex(h => h.square === squareName)
      if (anyHighlightIndex >= 0) {
        highlights.value.splice(anyHighlightIndex, 1)
      }
      highlights.value.push({ square: squareName, color })
    }
  } else {
    // Different square - toggle arrow
    const existingIndex = arrows.value.findIndex(a => a.from === from && a.to === squareName && a.color === color)
    if (existingIndex >= 0) {
      arrows.value.splice(existingIndex, 1)
    } else {
      // Remove any existing arrow with same from/to
      const anyArrowIndex = arrows.value.findIndex(a => a.from === from && a.to === squareName)
      if (anyArrowIndex >= 0) {
        arrows.value.splice(anyArrowIndex, 1)
      }
      arrows.value.push({ from, to: squareName, color })
    }
  }
  
  drawingArrow.value = null
  isRightMouseDown.value = false
}

const handleMouseEnter = (square: BoardSquare) => {
  // Optional: Show preview arrow while dragging
}

const clearAllDrawings = () => {
  arrows.value = []
  highlights.value = []
}

// Drag and drop handlers
const canDragPiece = (square: BoardSquare) => {
  if (reviewMode.value) return false
  if (!square.piece) return false
  
  const pieceColor = square.piece.color === 'w' ? 'white' : 'black'
  
  // Allow dragging if it's my turn (normal move) or not my turn (premove)
  return pieceColor === myColor.value && gameState.value?.status === 'active'
}

const handleDragStart = (event: DragEvent, square: BoardSquare) => {
  if (!canDragPiece(square)) {
    event.preventDefault()
    return
  }
  
  const squareName = `${square.file}${square.rank}`
  draggedSquare.value = squareName
  draggedPiece.value = square.piece
  
  // Set drag image to be transparent (piece stays visible on board)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
    event.dataTransfer.setDragImage(img, 0, 0)
  }
    // Trigger piece selection logic
  if (isMyTurn.value) {
    selectedSquare.value = squareName
  }
}

const handleDragOver = (event: DragEvent, square: BoardSquare) => {
  if (!draggedSquare.value) return
  
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (event: DragEvent, square: BoardSquare) => {
  event.preventDefault()
  
  if (!draggedSquare.value) return
  
  const fromSquare = draggedSquare.value
  const toSquare = `${square.file}${square.rank}`
    // Handle the move/premove
  if (isMyTurn.value) {
    // Normal move
    if (square.isLegalMove) {
      makeMove(fromSquare, toSquare)
    }
    selectedSquare.value = null
  }
  
  // Reset drag state
  draggedSquare.value = null
  draggedPiece.value = null
}

const handleDragEnd = () => {  draggedSquare.value = null
  draggedPiece.value = null
}

const setupSubscription = () => {
  const { $convex } = useNuxtApp()
  
  // Update game timer every second
  gameTimer = setInterval(() => {
    if (gameState.value?.status === 'active') {
      gameTime.value = Math.floor((Date.now() - gameState.value.createdAt) / 1000)
    }
  }, 1000)
  
  // Set up real-time subscription for game state
  unsubscribe = $convex.onUpdate(
    api.chess_games.getGameById, 
    { gameId: props.gameId },
    (updatedGame) => {
      if (!updatedGame) return
      
      console.log(`Received game update via subscription - Game ID: ${updatedGame.gameId}`)
      console.log(`Current turn: ${updatedGame.currentTurn}, FEN: ${updatedGame.fen}`)
      
      // Check if there's an actual change before updating
      if (gameState.value && 
          gameState.value.fen === updatedGame.fen && 
          gameState.value.lastMoveTime === updatedGame.lastMoveTime &&
          !updatedGame.drawOffer) {
        console.log('No meaningful changes detected, skipping update')
        return
      }
      
      // Check for draw offers
      if (updatedGame.drawOffer && user.value) {
        if (updatedGame.drawOffer.offeredTo === user.value.id) {
          // Draw was offered to me
          drawOfferInbound.value = true
          console.log('Draw offer received')
        } else if (updatedGame.drawOffer.offeredBy === user.value.id) {
          // I offered a draw
          drawOffered.value = true
          console.log('Draw offer sent')
        }
      } else {
        // No draw offer active
        drawOfferInbound.value = false
        drawOffered.value = false      }
      
      connectionStatus.value = 'Connected'
      
      gameState.value = {
        id: updatedGame.gameId,
        fen: updatedGame.fen,
        lastMove: updatedGame.lastMove || null,
        lastMoveTime: updatedGame.lastMoveTime,
        currentTurn: updatedGame.currentTurn,
        player1: {
          ...updatedGame.player1,
          avatarUrl: gameState.value?.player1?.avatarUrl // Preserve avatar from initial load
        },
        player2: {
          ...updatedGame.player2,
          avatarUrl: gameState.value?.player2?.avatarUrl // Preserve avatar from initial load
        },
        status: updatedGame.status,
        winner: updatedGame.winner,
        gameMode: updatedGame.gameMode || 'standard',
        createdAt: updatedGame.createdAt,
        moveHistory: updatedGame.moveHistory || [],
        // Timer fields
        whiteTimeMs: updatedGame.whiteTimeMs,
        blackTimeMs: updatedGame.blackTimeMs,
        timeControl: updatedGame.timeControl,
        lastMoveTimestamp: updatedGame.lastMoveTimestamp,
        gameStartTimestamp: updatedGame.gameStartTimestamp,
        timeoutWinner: updatedGame.timeoutWinner
      }
        // Update chess.js instance with new FEN
      try {
        game.value = new Chess(updatedGame.fen)
        
        // Log debug information about the game state
        console.log(`Updated game - My color: ${myColor.value}, Current turn: ${updatedGame.currentTurn}`)
        console.log(`Is my turn now: ${updatedGame.currentTurn === myColor.value}`)
          // Reset selected square when game state changes
        selectedSquare.value = null
          // Exit review mode when game updates
        if (reviewMode.value) {
          exitReviewMode()
        }
      } catch (error) {
        console.error('Error updating chess.js instance:', error)
      }
    }
  )
}

// Game control state
const showResignConfirmation = ref(false)
const drawOffered = ref(false)
const drawOfferInbound = ref(false)
const isGameInProgress = computed(() => {
  return gameState.value?.status === 'active' || gameState.value?.status === 'waiting'
})

// Game control methods
const confirmResign = () => {
  showResignConfirmation.value = true
}

const resignGame = async () => {
  showResignConfirmation.value = false
  
  try {
    const { $convex } = useNuxtApp()
    
    connectionStatus.value = 'Resigning game...'
    
    // Call the resign mutation with the updated function path
    await $convex.mutation('chess_games_gameEnd:resignGame', {
      gameId: props.gameId,
      playerId: user.value?.id
    })
    
    // The game state will be updated via subscription
    connectionStatus.value = 'Game resigned'
  } catch (error) {
    console.error('Failed to resign game:', error)
    gameError.value = 'Failed to resign: ' + (error instanceof Error ? error.message : String(error))
    
    // Show a user-friendly error message
    alert('Could not resign the game. Please try again later.')
    
    // Reset connection status
    connectionStatus.value = 'Connected'
  }
}

const offerDraw = async () => {
  if (drawOfferInbound.value) {
    // Accept incoming draw offer
    respondToDrawOffer(true)
    return
  }
    try {
    const { $convex } = useNuxtApp()
    
    connectionStatus.value = 'Offering draw...'
    
    // Call the offer draw mutation
    await $convex.mutation('chess_games_gameEnd:offerDraw', {
      gameId: props.gameId,
      playerId: user.value?.id
    })
    
    drawOffered.value = true
    connectionStatus.value = 'Draw offered'
  } catch (error) {
    console.error('Failed to offer draw:', error)
    gameError.value = 'Failed to offer draw: ' + (error instanceof Error ? error.message : String(error))
    
    // Show a user-friendly error message
    alert('Could not offer a draw. Please try again later.')
    
    // Reset connection status
    connectionStatus.value = 'Connected'
  }
}

const respondToDrawOffer = async (accepted: boolean) => {
  drawOfferInbound.value = false
  
  try {
    const { $convex } = useNuxtApp()
    
    connectionStatus.value = accepted ? 'Accepting draw...' : 'Declining draw...';
    
    // Call the draw response mutation
    await $convex.mutation('chess_games_gameEnd:respondToDrawOffer', {
      gameId: props.gameId,
      playerId: user.value?.id,
      accepted
    })
    
    if (accepted) {
      connectionStatus.value = 'Draw accepted'
    } else {
      connectionStatus.value = 'Draw declined'
    }
  } catch (error) {
    console.error('Failed to respond to draw offer:', error)
    gameError.value = 'Failed to respond: ' + (error instanceof Error ? error.message : String(error))
    
    // Show a user-friendly error message
    alert(`Could not ${accepted ? 'accept' : 'decline'} the draw offer. Please try again later.`)
      // Reset connection status
    connectionStatus.value = 'Connected'
    
    // Re-enable the draw offer if it failed
    drawOfferInbound.value = true
  }
}

// Chat functions - helper moved to component
const loadChatMessages = async () => {
  try {
    const { $convex } = useNuxtApp()
    
    // Use proper API reference
    const messages = await $convex.query(api.chat.getMessages, {
      gameId: props.gameId
    })
      chatMessages.value = messages || []
    // Scroll handled by ChessGameChat component
  } catch (error) {
    console.error('Failed to load chat messages:', error)
    // Set empty array on error to avoid undefined issues
    chatMessages.value = []
  }
}

const setupChatSubscription = () => {
  const { $convex } = useNuxtApp()
  
  // Use proper API reference
  chatUnsubscribe = $convex.onUpdate(
    api.chat.getMessages,
    { gameId: props.gameId },
    (messages) => {
      if (!messages) return
      
      console.log(`Received ${messages.length} chat messages`)
        // Track unread messages if chat is hidden
      if (!showChat.value && messages.length > chatMessages.value.length) {
        unreadMessages.value += (messages.length - chatMessages.value.length)
      }
      
      chatMessages.value = messages
      // Auto-scroll handled by ChessGameChat component
    }
  )
}

const sendChatMessage = async (message: string) => {
  if (!message.trim() || !user.value) return
  
  try {
    const { $convex } = useNuxtApp()
    
    const messageData = {
      gameId: props.gameId,
      userId: user.value.id,
      userName: user.value.name || 'Anonymous',
      message: message.trim()
    }
    
    console.log('Sending chat message:', messageData)
    
    // Use proper API reference
    const result = await $convex.mutation(api.chat.sendMessage, messageData)
    
    console.log('Message sent successfully:', result)
    
    // No need to reload messages - subscription will handle it
  } catch (error) {
    console.error('Failed to send message:', error)
    const err = error as Error
    console.error('Error details:', {
      name: err?.name,
      message: err?.message,
      stack: err?.stack
    })
    
    // Better user feedback
    connectionStatus.value = 'Chat error'
    setTimeout(() => {
      connectionStatus.value = 'Connected'
    }, 2000)
  }
}

const toggleChat = () => {
  showChat.value = !showChat.value
    // Clear unread count when opening chat
  if (showChat.value) {
    unreadMessages.value = 0
    // Scroll handled by ChessGameChat component
  }
}

const cleanup = () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  
  if (chatUnsubscribe) {
    chatUnsubscribe()
    chatUnsubscribe = null
  }
  
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
  
  // Remove keyboard event listener
  window.removeEventListener('keydown', handleKeyDown)
}

// Keyboard navigation handler
const handleKeyDown = (event: KeyboardEvent) => {
  // Only handle arrow keys if we have move history
  if (!gameState.value?.moveHistory || gameState.value.moveHistory.length === 0) return
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      goToPreviousMove()
      break
    case 'ArrowRight':
      event.preventDefault()
      goToNextMove()
      break
    case 'Escape':
      if (reviewMode.value) {
        event.preventDefault()
        exitReviewMode()
      }
      break
  }
}

onMounted(async () => {
  await loadGameState()
  setupSubscription()
  
  // Load initial chat messages before setting up subscription
  await loadChatMessages()
  setupChatSubscription()
  
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  cleanup()
})

// Expose methods to parent components
defineExpose({
  confirmResign,
  resignGame,
  offerDraw,
  isGameInProgress
})
</script>

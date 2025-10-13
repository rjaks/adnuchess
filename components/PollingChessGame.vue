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
              <p class="font-semibold text-slate-900">{{ opponent?.name || 'Opponent' }}</p>
              <p class="text-xs text-slate-500">{{ opponent?.color === 'white' ? 'White' : 'Black' }}</p>
            </div>
          </div>
          <div class="text-right">
            <div v-if="gameState?.status === 'finished'" class="text-sm font-semibold">
              <span v-if="gameState.winner === 'draw'" class="text-amber-600">Draw</span>
              <span v-else-if="gameState.winner === user?.id" class="text-green-600">You Won!</span>
              <span v-else class="text-red-600">You Lost</span>
            </div>
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
                  'aspect-square flex items-center justify-center text-2xl cursor-pointer transition-all',
                  getSquareColor(square.file, square.rank),
                  square.isSelected ? 'ring-4 ring-blue-500 ring-inset' : '',
                  square.isLegalMove ? 'ring-2 ring-green-400 ring-inset' : '',
                  square.isLastMove ? 'bg-yellow-200' : ''
                ]"
                @click="handleSquareClick(square)"
              >
                <span v-if="square.piece" class="select-none">
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
              <p class="font-semibold text-slate-900">{{ user?.name || 'You' }}</p>
              <p class="text-xs text-slate-500">{{ myColor === 'white' ? 'White' : 'Black' }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-600">Moves: {{ gameState?.moveHistory?.length || 0 }}</p>
          </div>
        </div>
      </div>      <!-- Game Info -->
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
        </div>
        
        <!-- Game Controls -->
        <div v-if="isGameInProgress" class="mt-6 flex justify-center gap-4">
          <button
            @click="confirmResign"
            class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition"
          >
            Resign
          </button>
          <button
            @click="offerDraw"
            class="rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition"
            :disabled="drawOffered && !drawOfferInbound"
          >
            {{ drawButtonText }}
          </button>
        </div>
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

// Game state
const gameLoaded = ref(false)
const gameError = ref('')
const gameState = ref<GameState | null>(null)
const game = ref(new Chess())
const selectedSquare = ref<string | null>(null)
const gameTime = ref(0)
const lastPolledTime = ref(0)

// Timer and subscription
let gameTimer: ReturnType<typeof setInterval> | null = null
let unsubscribe: (() => void) | null = null

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

// Board representation
const boardSquares = computed((): BoardSquare[] => {
  const squares: BoardSquare[] = []
  const board = game.value.board()
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = myColor.value === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]
  
  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
    const rank = ranks[rankIndex]
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex]
      if (rank !== undefined && file !== undefined) {
        const boardRank = 8 - rank
        const boardFile = fileIndex
        const piece = board[boardRank] ? board[boardRank][boardFile] : null
        const squareName = `${file}${rank}`
        
      // Check if this square is a legal move
        let isLegalMove = false
        if (selectedSquare.value) {
          const movesVerbose = game.value.moves({
            square: selectedSquare.value as Square,
            verbose: true
          })
          
          // Handle the case where moves might be an array of strings or objects
          if (movesVerbose.length > 0 && typeof movesVerbose[0] === 'object') {
            isLegalMove = (movesVerbose as any[]).some(move => move.to === squareName)
          }
        }
        
        squares.push({
          file,
          rank,
          piece,
          isSelected: selectedSquare.value === squareName,
          isLegalMove,
          isLastMove: gameState.value?.lastMove === squareName
        })
      }
    }
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
      gameState.value = {
        id: response.gameId,
        fen: response.fen,
        lastMove: response.lastMove || null,
        lastMoveTime: response.lastMoveTime,
        currentTurn: response.currentTurn,
        player1: response.player1,
        player2: response.player2,
        status: response.status,
        winner: response.winner,
        gameMode: response.gameMode,
        createdAt: response.createdAt,
        moveHistory: response.moveHistory
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
      playerId: user.value.id
    })
    
    // First try with direct string reference
    try {
      const result = await $convex.mutation('games:makeMove', {
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
    const possibleMovesVerbose = game.value.moves({ 
      square: from as Square, 
      verbose: true 
    })
    
    // Handle the case where moves might be an array of strings or objects
    let validMove = false
    if (possibleMovesVerbose.length > 0 && typeof possibleMovesVerbose[0] === 'object') {
      validMove = (possibleMovesVerbose as any[]).some(move => move.to === to)
    }
    
    if (validMove) {
      makeMove(from, to)
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
    w: { 
      k: '♔', 
      q: '♕', 
      r: '♖', 
      b: '♗', 
      n: '♘', 
      p: '♙' 
    },
    b: { 
      k: '♚', 
      q: '♛', 
      r: '♜', 
      b: '♝', 
      n: '♞', 
      p: '♟' 
    }
  }
  
  // Safer type checking before accessing
  if (color === 'w' || color === 'b') {
    const colorPieces = pieces[color]
    if (type in colorPieces) {
      return colorPieces[type as keyof typeof colorPieces]
    }
  }
  
  // Fallback
  return ''
}

const formatGameTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const setupSubscription = () => {
  const { $convex } = useNuxtApp()
  
  // Update game timer every second
  gameTimer = setInterval(() => {
    if (gameState.value?.status === 'active') {
      gameTime.value = Math.floor((Date.now() - gameState.value.createdAt) / 1000)
    }
  }, 1000)
  
  // Set up real-time subscription
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
        drawOffered.value = false
      }
      
      connectionStatus.value = 'Connected'
      gameState.value = {
        id: updatedGame.gameId,
        fen: updatedGame.fen,
        lastMove: updatedGame.lastMove || null,
        lastMoveTime: updatedGame.lastMoveTime,
        currentTurn: updatedGame.currentTurn,
        player1: updatedGame.player1,
        player2: updatedGame.player2,
        status: updatedGame.status,
        winner: updatedGame.winner,
        gameMode: updatedGame.gameMode || 'standard',
        createdAt: updatedGame.createdAt,
        moveHistory: updatedGame.moveHistory || []
      }
      
      // Update chess.js instance with new FEN
      try {
        game.value = new Chess(updatedGame.fen)
        
        // Log debug information about the game state
        console.log(`Updated game - My color: ${myColor.value}, Current turn: ${updatedGame.currentTurn}`)
        console.log(`Is my turn now: ${updatedGame.currentTurn === myColor.value}`)
        
        // Reset selected square when game state changes
        selectedSquare.value = null
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
const drawButtonText = computed(() => {
  if (drawOfferInbound.value) return 'Accept Draw'
  return drawOffered.value ? 'Draw Offered' : 'Offer Draw'
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

const cleanup = () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

onMounted(async () => {
  await loadGameState()
  setupSubscription()
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

<template>
  <div class="space-y-6">
    <!-- Game Setup Screen -->
    <div v-if="!gameStarted" class="space-y-6">
      <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
        <h2 class="text-xl font-bold text-slate-900 mb-4">Play vs Bot</h2>
        <p class="text-sm text-slate-600 mb-6">
          Challenge our AI powered by Lichess Cloud Stockfish. Choose your difficulty and start playing!
        </p>

        <!-- Difficulty Selection -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-slate-700 mb-3">Select Difficulty</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              v-for="level in difficultyLevels"
              :key="level.depth"
              type="button"
              class="rounded-xl border-2 px-4 py-3 text-center transition-all"
              :class="[
                selectedDifficulty === level.depth
                  ? 'border-[#021d94] bg-[#021d94]/10 text-[#021d94]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              ]"
              @click="selectedDifficulty = level.depth"
            >
              <div class="text-lg mb-1">{{ level.icon }}</div>
              <div class="font-semibold text-sm">{{ level.name }}</div>
              <div class="text-xs opacity-70">Depth {{ level.depth }}</div>
            </button>
          </div>
        </div>

        <!-- Color Selection -->
        <div class="mb-6">
          <label class="block text-sm font-semibold text-slate-700 mb-3">Play as</label>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all"
              :class="[
                playerColor === 'white'
                  ? 'border-[#021d94] bg-[#021d94]/10 text-[#021d94]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              ]"
              @click="playerColor = 'white'"
            >
              <div class="text-2xl mb-1">♔</div>
              <div class="font-semibold">White</div>
              <div class="text-xs opacity-70">Move first</div>
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl border-2 px-4 py-3 text-center transition-all"
              :class="[
                playerColor === 'black'
                  ? 'border-[#021d94] bg-[#021d94]/10 text-[#021d94]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              ]"
              @click="playerColor = 'black'"
            >
              <div class="text-2xl mb-1">♚</div>
              <div class="font-semibold">Black</div>
              <div class="text-xs opacity-70">Bot moves first</div>
            </button>
          </div>
        </div>

        <!-- Start Button -->
        <button
          type="button"
          class="w-full rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-6 py-3 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          :disabled="isStartingGame"
          @click="startGame"
        >
          <span v-if="isStartingGame" class="inline-flex items-center gap-2">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Starting game...
          </span>
          <span v-else>Start Game</span>
        </button>
      </div>
    </div>

    <!-- Active Game -->
    <div v-else class="space-y-6">
      <!-- Game Header -->
      <div class="rounded-3xl border border-white/70 bg-gradient-to-r from-[#021d94]/10 to-[#ffaa00]/10 p-4 shadow-inner">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-2xl">🤖</div>
            <div>
              <p class="text-sm font-semibold text-slate-900">vs Stockfish Bot</p>
              <p class="text-xs text-slate-600">
                Difficulty: {{ currentDifficultyName }} • 
                Playing as {{ playerColor === 'white' ? 'White' : 'Black' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span 
              v-if="botThinking" 
              class="inline-flex items-center gap-2 rounded-full border border-[#021d94]/30 bg-[#021d94]/10 px-3 py-1 text-xs font-medium text-[#021d94]"
            >
              <span class="h-2 w-2 animate-pulse rounded-full bg-[#021d94]"></span>
              Bot is thinking...
            </span>
            <span 
              v-else-if="isMyTurn" 
              class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
            >
              Your turn
            </span>
            <span 
              v-else 
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              Bot's turn
            </span>
          </div>
        </div>
      </div>

      <!-- Chess Board -->
      <div class="rounded-4xl border border-white/70 bg-white/60 p-6 shadow-glass backdrop-blur-xl">
        <div class="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <!-- Board -->
          <div class="mx-auto w-full max-w-[420px]">
            <div class="relative aspect-square">
              <div class="absolute inset-0 grid grid-cols-8 grid-rows-8 rounded-lg border-2 border-white/30 overflow-hidden">
                <button
                  v-for="sq in boardSquares"
                  :key="sq.square"
                  type="button"
                  class="relative flex items-center justify-center text-3xl font-semibold transition focus:outline-none"
                  :class="squareClass(sq)"
                  :disabled="!canInteract || botThinking"
                  @click="handleSquareClick(sq.square)"
                >
                  <span v-if="sq.piece" class="drop-shadow-sm">{{ pieceGlyph(sq.piece) }}</span>
                  <span
                    v-if="isLegalTarget(sq.square)"
                    class="absolute h-2.5 w-2.5 rounded-full bg-[#021d94]/70"
                  ></span>
                </button>
              </div>
              
              <!-- Bot Thinking Overlay -->
              <div
                v-if="botThinking"
                class="pointer-events-none absolute inset-x-8 top-4 flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-2 text-sm font-medium text-[#021d94] shadow-lg"
              >
                <span class="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-[#021d94] border-t-transparent"></span>
                Stockfish is analyzing...
              </div>
            </div>
          </div>

          <!-- Move History & Controls -->
          <div class="w-full lg:w-80 space-y-4">
            <!-- Move Log -->
            <div class="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-inner">
              <h3 class="text-sm font-semibold text-slate-900 mb-3">Move History</h3>
              <div v-if="moveLog.length > 0" class="max-h-60 overflow-y-auto">
                <ol class="grid grid-cols-1 gap-y-1 text-sm text-slate-700">
                  <li 
                    v-for="entry in moveLog" 
                    :key="entry.index" 
                    class="flex items-center gap-3 rounded px-2 py-1 hover:bg-slate-100"
                  >
                    <span class="text-xs font-semibold text-slate-400 w-6">{{ entry.index }}.</span>
                    <span class="font-mono">{{ entry.white }}</span>
                    <span class="font-mono text-[#021d94]">{{ entry.black ?? '...' }}</span>
                  </li>
                </ol>
              </div>
              <p v-else class="text-sm text-slate-500">No moves yet</p>
            </div>

            <!-- Game Status -->
            <div class="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-inner">
              <h3 class="text-sm font-semibold text-slate-900 mb-2">Game Status</h3>
              <p class="text-sm text-slate-600">{{ statusMessage }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                :disabled="moveHistory.length === 0 || botThinking || gameOver"
                @click="undoMove"
              >
                Undo Move
              </button>
              <button
                type="button"
                class="flex-1 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
                @click="newGame"
              >
                New Game
              </button>
            </div>

            <!-- Resign Button -->
            <button
              v-if="!gameOver"
              type="button"
              class="w-full rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              @click="resignGame"
            >
              Resign
            </button>
          </div>
        </div>
      </div>

      <!-- Game Over Modal -->
      <Teleport to="body">
        <div 
          v-if="showGameOverModal" 
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          @click.self="showGameOverModal = false"
        >
          <div class="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 text-center">
            <div class="text-5xl mb-4">{{ gameOverIcon }}</div>
            <h2 class="text-2xl font-bold text-slate-900 mb-2">{{ gameOverTitle }}</h2>
            <p class="text-slate-600 mb-6">{{ gameOverMessage }}</p>
            <div class="flex gap-3 justify-center">
              <button
                type="button"
                class="rounded-full border border-slate-300 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                @click="showGameOverModal = false"
              >
                Close
              </button>
              <button
                type="button"
                class="rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-6 py-2 font-semibold text-white hover:shadow-lg"
                @click="newGame"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch, onMounted } from 'vue'
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'

// Types
interface VisualSquare {
  square: Square
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null
  rankIndex: number
  fileIndex: number
}

interface DifficultyLevel {
  depth: number
  name: string
  icon: string
}

// Difficulty levels
const difficultyLevels: DifficultyLevel[] = [
  { depth: 5, name: 'Beginner', icon: '🌱' },
  { depth: 10, name: 'Easy', icon: '😊' },
  { depth: 15, name: 'Medium', icon: '🎯' },
  { depth: 20, name: 'Hard', icon: '🔥' },
]

// Auth & Convex
const { user } = useAuth()
const { $convex } = useNuxtApp()

// Game setup state
const gameStarted = ref(false)
const isStartingGame = ref(false)
const selectedDifficulty = ref(10)
const playerColor = ref<'white' | 'black'>('white')

// Game state
const game = shallowRef(new Chess())
const gameId = ref<string | null>(null)
const fen = ref(game.value.fen())
const selectedSquare = ref<Square | null>(null)
const legalMoves = ref<Move[]>([])
const moveHistory = ref<string[]>([])
const statusMessage = ref('Click a piece to begin')
const botThinking = ref(false)
const gameOver = ref(false)
const gameResult = ref<'win' | 'loss' | 'draw' | null>(null)
const showGameOverModal = ref(false)

// Board configuration
const files: Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'> = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

// Computed properties
const myColor = computed(() => playerColor.value === 'white' ? 'w' : 'b')
const botColor = computed(() => playerColor.value === 'white' ? 'b' : 'w')
const isMyTurn = computed(() => game.value.turn() === myColor.value)
const canInteract = computed(() => isMyTurn.value && !gameOver.value && !botThinking.value)

const currentDifficultyName = computed(() => {
  const level = difficultyLevels.find(l => l.depth === selectedDifficulty.value)
  return level?.name || 'Custom'
})

const boardSquares = computed<VisualSquare[]>(() => {
  fen.value // Trigger reactivity
  const board = game.value.board()
  const visuals: VisualSquare[] = []
  
  // Flip board if playing as black
  const displayRanks = playerColor.value === 'black' ? [...ranks].reverse() : ranks
  const displayFiles = playerColor.value === 'black' ? [...files].reverse() : files
  
  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    const rank = displayRanks[rankIdx]!
    const actualRankIndex = ranks.indexOf(rank)
    const row = board[actualRankIndex]
    if (!row) continue
    
    for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
      const file = displayFiles[fileIdx]!
      const actualFileIndex = files.indexOf(file)
      const square = `${file}${rank}` as Square
      const piece = row[actualFileIndex]
      
      visuals.push({
        square,
        piece: piece ? { type: piece.type, color: piece.color } : null,
        rankIndex: rankIdx,
        fileIndex: fileIdx,
      })
    }
  }
  return visuals
})

const legalTargets = computed(() => new Set(legalMoves.value.map(m => m.to)))

const moveLog = computed(() => {
  const pairs: Array<{ index: number; white: string; black?: string }> = []
  const moves = moveHistory.value
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i]
    if (!white) continue
    pairs.push({
      index: i / 2 + 1,
      white,
      black: moves[i + 1],
    })
  }
  return pairs
})

// Game over computed
const gameOverIcon = computed(() => {
  if (gameResult.value === 'win') return '🏆'
  if (gameResult.value === 'loss') return '😔'
  return '🤝'
})

const gameOverTitle = computed(() => {
  if (gameResult.value === 'win') return 'Victory!'
  if (gameResult.value === 'loss') return 'Defeat'
  return 'Draw'
})

const gameOverMessage = computed(() => {
  if (gameResult.value === 'win') return 'Congratulations! You defeated the bot!'
  if (gameResult.value === 'loss') return 'The bot won this time. Try again!'
  return 'The game ended in a draw.'
})

// Piece rendering
const pieceGlyph = (piece: { type: PieceSymbol; color: 'w' | 'b' }) => {
  const glyphMap: Record<'w' | 'b', Record<PieceSymbol, string>> = {
    w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
    b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
  }
  return glyphMap[piece.color][piece.type]
}

const squareClass = (sq: VisualSquare) => {
  const isDark = (sq.rankIndex + sq.fileIndex) % 2 === 1
  const classes = [
    isDark ? 'bg-[#021d94]/20' : 'bg-white/60',
    'border border-white/30',
  ]
  if (selectedSquare.value === sq.square) {
    classes.push('ring-2 ring-[#ffaa00]/80')
  }
  if (legalTargets.value.has(sq.square)) {
    classes.push('shadow-inner shadow-[#021d94]/30')
  }
  return classes
}

const isLegalTarget = (square: Square) => legalTargets.value.has(square)

// Game actions
const startGame = async () => {
  isStartingGame.value = true
  
  try {
    // Generate a unique game ID
    const newGameId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create game in Convex
    const userId = user.value?.id || 'anonymous'
    const userName = user.value?.name || 'Player'
    
    await $convex.mutation(api.chess_games.createGame, {
      gameId: newGameId,
      player1: {
        id: playerColor.value === 'white' ? userId : 'stockfish-bot',
        name: playerColor.value === 'white' ? userName : 'Stockfish Bot',
        color: 'white',
      },
      player2: {
        id: playerColor.value === 'black' ? userId : 'stockfish-bot',
        name: playerColor.value === 'black' ? userName : 'Stockfish Bot',
        color: 'black',
      },
      gameMode: 'bot',
    })
    
    // Initialize game state
    gameId.value = newGameId
    game.value = new Chess()
    fen.value = game.value.fen()
    moveHistory.value = []
    selectedSquare.value = null
    legalMoves.value = []
    gameOver.value = false
    gameResult.value = null
    statusMessage.value = playerColor.value === 'white' ? 'Your turn - Click a piece to move' : 'Bot is making the first move...'
    
    gameStarted.value = true
    
    // If player is black, bot moves first
    if (playerColor.value === 'black') {
      await requestBotMove()
    }
  } catch (error) {
    console.error('Failed to start game:', error)
    statusMessage.value = 'Failed to start game. Please try again.'
  } finally {
    isStartingGame.value = false
  }
}

const handleSquareClick = (square: Square) => {
  if (!canInteract.value) return
  
  const piece = game.value.get(square)
  
  // Deselect if clicking the same square
  if (selectedSquare.value === square) {
    selectedSquare.value = null
    legalMoves.value = []
    return
  }
  
  // If no piece selected, select this piece if it's ours
  if (!selectedSquare.value) {
    if (!piece || piece.color !== myColor.value) return
    selectedSquare.value = square
    legalMoves.value = game.value.moves({ square, verbose: true })
    return
  }
  
  // Check if this is a legal move
  const move = legalMoves.value.find(m => m.to === square)
  if (!move) {
    // If clicking own piece, switch selection
    if (piece && piece.color === myColor.value) {
      selectedSquare.value = square
      legalMoves.value = game.value.moves({ square, verbose: true })
    }
    return
  }
  
  // Make the move
  makeUserMove(selectedSquare.value, square, (move.promotion || 'q') as 'q' | 'r' | 'b' | 'n')
}

const makeUserMove = async (from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n') => {
  const moveResult = game.value.move({ from, to, promotion })
  if (!moveResult) return
  
  // Update local state
  selectedSquare.value = null
  legalMoves.value = []
  fen.value = game.value.fen()
  moveHistory.value = game.value.history()
  
  // Sync to Convex
  if (gameId.value) {
    try {
      await $convex.mutation(api.bot.makeBotMove, {
        gameId: gameId.value,
        move: from + to + (promotion !== 'q' ? promotion : ''),
      })
    } catch (error) {
      console.error('Failed to sync move to Convex:', error)
    }
  }
  
  // Check for game over
  if (checkGameOver('user')) return
  
  // Request bot move
  statusMessage.value = 'Bot is thinking...'
  await requestBotMove()
}

const requestBotMove = async () => {
  if (gameOver.value || !gameId.value) return
  
  botThinking.value = true
  
  try {
    // Call Convex action to get bot move from Lichess API
    const result = await $convex.action(api.bot.getLichessBotMove, {
      gameId: gameId.value,
      fen: game.value.fen(),
      difficultyDepth: selectedDifficulty.value,
    })
    
    if (!result.success || !result.move) {
      console.error('Bot move failed:', result.error)
      statusMessage.value = 'Bot failed to calculate move. Your turn.'
      botThinking.value = false
      return
    }
    
    // Apply bot move locally
    const from = result.move.slice(0, 2) as Square
    const to = result.move.slice(2, 4) as Square
    const promotion = result.move.length > 4 ? result.move.slice(4, 5) as 'q' | 'r' | 'b' | 'n' : undefined
    
    const moveResult = game.value.move({ from, to, promotion })
    if (!moveResult) {
      console.error('Invalid bot move:', result.move)
      statusMessage.value = 'Bot made invalid move. Your turn.'
      botThinking.value = false
      return
    }
    
    // Update local state
    fen.value = game.value.fen()
    moveHistory.value = game.value.history()
    
    // Sync bot move to Convex
    await $convex.mutation(api.bot.makeBotMove, {
      gameId: gameId.value,
      move: result.move,
    })
    
    // Check for game over
    if (checkGameOver('bot')) return
    
    // Show evaluation if available
    if (result.evaluation) {
      const evalStr = result.evaluation.mate 
        ? `Mate in ${Math.abs(result.evaluation.mate)}`
        : result.evaluation.cp !== undefined 
          ? `Eval: ${(result.evaluation.cp / 100).toFixed(2)}`
          : ''
      statusMessage.value = `Your turn. ${evalStr}`
    } else {
      statusMessage.value = 'Your turn'
    }
  } catch (error) {
    console.error('Error getting bot move:', error)
    statusMessage.value = 'Error occurred. Your turn.'
  } finally {
    botThinking.value = false
  }
}

const checkGameOver = (lastMover: 'user' | 'bot'): boolean => {
  if (!game.value.isGameOver()) return false
  
  gameOver.value = true
  
  if (game.value.isCheckmate()) {
    // The player who just moved wins
    if (lastMover === 'user') {
      gameResult.value = 'win'
      statusMessage.value = 'Checkmate! You win!'
    } else {
      gameResult.value = 'loss'
      statusMessage.value = 'Checkmate! Bot wins.'
    }
  } else {
    // Any other game over condition is a draw
    gameResult.value = 'draw'
    if (game.value.isStalemate()) {
      statusMessage.value = 'Stalemate - Draw!'
    } else {
      statusMessage.value = 'Draw!'
    }
  }
  
  showGameOverModal.value = true
  return true
}

const undoMove = () => {
  if (moveHistory.value.length === 0 || botThinking.value || gameOver.value) return
  
  // Undo both user's and bot's move
  game.value.undo()
  if (game.value.turn() !== myColor.value) {
    game.value.undo()
  }
  
  fen.value = game.value.fen()
  moveHistory.value = game.value.history()
  selectedSquare.value = null
  legalMoves.value = []
  statusMessage.value = 'Move undone. Your turn.'
}

const resignGame = () => {
  if (gameOver.value) return
  
  gameOver.value = true
  gameResult.value = 'loss'
  statusMessage.value = 'You resigned. Bot wins.'
  showGameOverModal.value = true
}

const newGame = () => {
  gameStarted.value = false
  gameOver.value = false
  gameResult.value = null
  showGameOverModal.value = false
  game.value = new Chess()
  fen.value = game.value.fen()
  moveHistory.value = []
  selectedSquare.value = null
  legalMoves.value = []
  statusMessage.value = 'Click a piece to begin'
  gameId.value = null
}
</script>

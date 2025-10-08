<template>
  <section class="space-y-6">
    <div class="mx-auto w-full max-w-[480px]">
      <div class="relative aspect-square rounded-3xl border border-white/70 bg-white/60 p-4 shadow-inner">
        <div class="absolute inset-4 grid grid-cols-8 grid-rows-8">
          <button
            v-for="visual in boardSquares"
            :key="visual.square"
            type="button"
            class="relative flex items-center justify-center font-semibold text-3xl transition focus:outline-none"
            :class="squareClass(visual)"
            @click="handleSquareClick(visual.square)"
            :disabled="!isPlayerTurn || gameOver"
          >
            <span v-if="visual.piece" class="drop-shadow-sm">{{ pieceGlyph(visual.piece) }}</span>
            <span
              v-if="isLegalTarget(visual.square)"
              class="absolute h-2.5 w-2.5 rounded-full bg-[#021d94]/70"
            ></span>
          </button>
        </div>
        
        <!-- Turn indicator -->
        <div
          v-if="!gameOver"
          class="absolute left-4 top-4 flex items-center gap-2 rounded-lg border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-[#021d94]/80 shadow"
        >
          <span 
            class="h-2 w-2 rounded-full"
            :class="isPlayerTurn ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'"
          ></span>
          {{ isPlayerTurn ? 'Your turn' : "Opponent's turn" }}
        </div>
        
        <!-- Game over overlay -->
        <div
          v-if="gameOver"
          class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl"
        >
          <div class="rounded-2xl bg-white p-6 text-center shadow-xl">
            <h3 class="text-xl font-bold text-slate-900">{{ gameResult }}</h3>
            <p class="mt-2 text-sm text-slate-600">{{ gameResultMessage }}</p>
            <button
              @click="$emit('game-end', localResult)"
              class="mt-4 rounded-lg bg-[#021d94] px-4 py-2 text-sm font-semibold text-white hover:bg-[#021d94]/90"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Move history -->
    <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
      <h3 class="text-lg font-semibold text-slate-900">Move History</h3>
      <div class="mt-4 max-h-32 overflow-y-auto">
        <ol v-if="moveHistory.length > 0" class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-700">
          <li v-for="entry in moveLog" :key="entry.index" class="flex items-center gap-3">
            <span class="text-xs font-semibold text-slate-400 w-6">{{ entry.index }}.</span>
            <span class="font-mono">{{ entry.white }}</span>
            <span class="font-mono text-[#021d94]">{{ entry.black ?? '...' }}</span>
          </li>
        </ol>
        <p v-else class="text-sm text-slate-500">No moves yet</p>
      </div>
    </div>

    <!-- Game control buttons -->
    <div v-if="!gameOver" class="flex justify-center gap-4">
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

    <!-- Draw offer modal -->
    <div v-if="drawOfferInbound && !gameOver" class="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
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
  </section>
</template>

<script setup lang="ts">
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

interface Props {
  matchId: string
  playerColor: 'white' | 'black'
  opponent?: {
    id: string
    name: string
    rating: number
  }
}

interface Emits {
  (e: 'game-end', result: 'win' | 'loss' | 'draw'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

type VisualSquare = {
  square: Square
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null
  rankIndex: number
  fileIndex: number
}

// Game state
const game = shallowRef(new Chess())
const fen = ref(game.value.fen())
const selectedSquare = ref<Square | null>(null)
const legalMoves = ref<Move[]>([])
const moveHistory = ref<string[]>([])
const gameOver = ref(false)
const gameResult = ref('')
const gameResultMessage = ref('')
const localResult = ref<'win' | 'loss' | 'draw'>('draw')

// Game control state
const showResignConfirmation = ref(false)
const drawOffered = ref(false)
const drawOfferInbound = ref(false)
const drawButtonText = computed(() => {
  if (drawOfferInbound) return 'Accept Draw'
  return drawOffered ? 'Draw Offered' : 'Offer Draw'
})

// WebSocket for real-time sync
let ws: WebSocket | null = null

const files: Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'> = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = props.playerColor === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8]

const boardSquares = computed<VisualSquare[]>(() => {
  fen.value // Trigger reactivity
  const board = game.value.board()
  const visuals: VisualSquare[] = []
  
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const rank = ranks[rankIndex]
    const boardRankIndex = props.playerColor === 'white' ? rankIndex : 7 - rankIndex
    const row = board[boardRankIndex]
    
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const file = files[fileIndex]
      const square = `${file}${rank}` as Square
      const piece = row[fileIndex]
      
      visuals.push({
        square,
        piece: piece ? { type: piece.type, color: piece.color } : null,
        rankIndex,
        fileIndex,
      })
    }
  }
  return visuals
})

const legalTargets = computed(() => new Set(legalMoves.value.map((move) => move.to)))

const isPlayerTurn = computed(() => {
  const currentTurn = game.value.turn() === 'w' ? 'white' : 'black'
  return currentTurn === props.playerColor && !gameOver.value
})

const moveLog = computed(() => {
  const pairs: Array<{ index: number; white: string; black?: string }> = []
  const moves = moveHistory.value
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      index: i / 2 + 1,
      white: moves[i],
      black: moves[i + 1],
    })
  }
  return pairs
})

const pieceGlyph = (piece: { type: PieceSymbol; color: 'w' | 'b' }) => {
  const glyphMap: Record<'w' | 'b', Record<PieceSymbol, string>> = {
    w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
    b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
  }
  return glyphMap[piece.color][piece.type]
}

const squareClass = (visual: VisualSquare) => {
  const isDark = (visual.rankIndex + visual.fileIndex) % 2 === 1
  const classes = [isDark ? 'bg-[#021d94]/20' : 'bg-white/60', 'border border-white/30']
  
  if (selectedSquare.value === visual.square) {
    classes.push('ring-2 ring-[#ffaa00]/80')
  }
  if (legalTargets.value.has(visual.square)) {
    classes.push('shadow-inner shadow-[#021d94]/30')
  }
  return classes
}

const isLegalTarget = (square: Square) => legalTargets.value.has(square)

const handleSquareClick = (square: Square) => {
  if (!isPlayerTurn.value || gameOver.value) return

  const piece = game.value.get(square)

  // Deselect if clicking same square
  if (selectedSquare.value === square) {
    selectedSquare.value = null
    legalMoves.value = []
    return
  }

  // Select piece if no piece selected and clicking own piece
  if (!selectedSquare.value) {
    const playerColorCode = props.playerColor === 'white' ? 'w' : 'b'
    if (!piece || piece.color !== playerColorCode) return
    
    selectedSquare.value = square
    legalMoves.value = game.value.moves({ square, verbose: true })
    return
  }

  // Try to make a move
  const move = legalMoves.value.find((candidate) => candidate.to === square)
  if (!move) {
    // Select new piece if clicking own piece
    const playerColorCode = props.playerColor === 'white' ? 'w' : 'b'
    if (piece && piece.color === playerColorCode) {
      selectedSquare.value = square
      legalMoves.value = game.value.moves({ square, verbose: true })
    }
    return
  }

  makeMove(move.from as Square, move.to as Square, move.promotion ?? 'q')
}

const makeMove = (from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n') => {
  const move = game.value.move({ from, to, promotion })
  if (!move) return

  selectedSquare.value = null
  legalMoves.value = []
  fen.value = game.value.fen()
  moveHistory.value = game.value.history()

  // Send move to server
  sendMoveToServer(move.san)

  // Check for game end
  if (game.value.isGameOver()) {
    endGame()
  }
}

const sendMoveToServer = (move: string) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'move',
      matchId: props.matchId,
      move,
      fen: game.value.fen()
    }))
  }
}

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/api/game/ws`
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    // Join the specific game room
    ws?.send(JSON.stringify({
      type: 'join_game',
      matchId: props.matchId
    }))
  }
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    } catch (error) {
      console.error('Invalid WebSocket message:', error)
    }
  }
  
  ws.onclose = () => {
    console.log('Game WebSocket closed')
  }
}

const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'opponent_move':
      // Apply opponent's move
      try {
        game.value.move(data.move)
        fen.value = game.value.fen()
        moveHistory.value = game.value.history()
        
        if (game.value.isGameOver()) {
          endGame()
        }
      } catch (error) {
        console.error('Invalid opponent move:', error)
      }
      break
      
    case 'game_ended':
      gameOver.value = true
      gameResult.value = data.result
      gameResultMessage.value = data.message
      localResult.value = data.playerResult
      break
      
    case 'draw_offered':
      // Opponent offered a draw
      drawOfferInbound.value = true
      break
      
    case 'draw_declined':
      // Opponent declined our draw offer
      drawOffered.value = false
      break
  }
}

// Game control functions
const confirmResign = () => {
  showResignConfirmation.value = true
}

const resignGame = () => {
  showResignConfirmation.value = false
  
  // Notify server about resignation
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({
        type: 'resign',
        matchId: props.matchId
      }))
      
      // Set game as resigned locally after sending the message
      gameOver.value = true
      gameResult.value = 'You Lose'
      gameResultMessage.value = 'You resigned the game.'
      localResult.value = 'loss'
    } catch (error) {
      console.error('Failed to resign game:', error)
      // Show error alert
      alert('Failed to resign the game. Please try again.')
    }
  } else {
    console.error('WebSocket not connected, cannot resign')
    alert('Connection issue. Please try again.')
  }
}

const offerDraw = () => {
  if (drawOfferInbound) {
    // Accept incoming draw offer
    respondToDrawOffer(true)
    return
  }
  
  // Send draw offer to opponent
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'offer_draw',
      matchId: props.matchId
    }))
    drawOffered.value = true
  }
}

const respondToDrawOffer = (accepted: boolean) => {
  drawOfferInbound.value = false
  
  if (accepted) {
    // Accept the draw
    gameOver.value = true
    gameResult.value = 'Draw'
    gameResultMessage.value = 'Draw agreed by both players.'
    localResult.value = 'draw'
  }
  
  // Notify server about draw response
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'draw_response',
      matchId: props.matchId,
      accepted
    }))
  }
}

const endGame = () => {
  gameOver.value = true
  
  // Use the safer approach with try-catch to handle different chess.js versions
  try {
    // Check for checkmate
    let isInCheckmate = false;
    try {
      // @ts-ignore - Different chess.js versions use different methods
      isInCheckmate = game.value.in_checkmate?.() || game.value.isCheckmate?.();
    } catch (e) {
      console.error('Error checking checkmate:', e);
    }
    
    // Check for draw
    let isDrawn = false;
    try {
      // @ts-ignore - Different chess.js versions use different methods
      isDrawn = game.value.in_draw?.() || game.value.isDraw?.();
    } catch (e) {
      console.error('Error checking draw:', e);
    }
    
    if (isInCheckmate) {
      const winner = game.value.turn() === 'w' ? 'black' : 'white'
      if (winner === props.playerColor) {
        gameResult.value = 'You Win!'
        gameResultMessage.value = 'Checkmate! Well played.'
        localResult.value = 'win'
      } else {
        gameResult.value = 'You Lose'
        gameResultMessage.value = 'Checkmate! Better luck next time.'
        localResult.value = 'loss'
      }
    } else if (isDrawn) {
      gameResult.value = 'Draw'
      gameResultMessage.value = 'The game ended in a draw.'
      localResult.value = 'draw'
    }
  } catch (error) {
    console.error('Error determining game result:', error);
    gameResult.value = 'Game Over';
    gameResultMessage.value = 'The game has ended.';
    localResult.value = 'draw';
  }
  
  // Notify server about game end
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'game_end',
      matchId: props.matchId,
      result: localResult.value
    }))
  }
}

onMounted(() => {
  connectWebSocket()
})

onBeforeUnmount(() => {
  // If game is still in progress, send resignation before closing
  if (!gameOver.value && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'resign',
      matchId: props.matchId,
      reason: 'player_left'
    }))
  }
  
  if (ws) {
    ws.close()
  }
})
</script>
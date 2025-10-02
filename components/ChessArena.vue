<template>
  <section 
    ref="arenaSection"
    class="space-y-10 rounded-4xl border border-white/70 bg-white/60 p-8 shadow-glass backdrop-blur-xl"
  >
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div class="mx-auto w-full max-w-[420px]">
        <div 
          ref="chessBoard"
          class="relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-4 shadow-inner"
          :class="{
            'fixed inset-0 z-50 rounded-none border-none bg-slate-900 p-6': isFullscreen
          }"
        >
          <!-- Fullscreen layout with board and move log -->
          <div v-if="isFullscreen" class="w-full h-full flex items-center justify-center">
            <div class="flex w-full h-full items-center justify-center gap-6 px-6">
              <!-- Chess board in fullscreen -->
              <div class="flex-shrink-0 flex flex-col items-center">
                <div 
                  class="mb-4 flex items-center justify-between text-lg font-medium uppercase tracking-[0.35em] text-white/90 w-full"
                  ref="fullscreenHeaderEl"
                >
                  <span>AdNU Player</span>
                  <span>Stockfish</span>
                </div>
                <div class="relative" :style="{ width: boardSize + 'px', height: boardSize + 'px' }">
                  <div class="absolute inset-0 grid grid-cols-8 grid-rows-8 border-2 border-white/20 rounded-lg overflow-hidden">
                    <button
                      v-for="visual in boardSquares"
                      :key="visual.square"
                      type="button"
                      class="relative flex items-center justify-center font-semibold transition focus:outline-none"
                      :style="{ fontSize: pieceSize + 'px' }"
                      :class="squareClass(visual)"
                      @click="handleSquareClick(visual.square)"
                    >
                      <span v-if="visual.piece" class="drop-shadow-sm">{{ pieceGlyph(visual.piece) }}</span>
                      <span
                        v-if="isLegalTarget(visual.square)"
                        class="absolute rounded-full bg-[#021d94]/70"
                        :style="{ width: dotSize + 'px', height: dotSize + 'px' }"
                      ></span>
                    </button>
                  </div>
                  <div
                    v-if="engineThinking"
                    class="pointer-events-none absolute inset-x-8 top-4 flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-[#021d94]/80 shadow"
                  >
                    <span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#021d94]"></span>
                    Stockfish is thinking...
                  </div>
                  <!-- Fullscreen exit indicator and move log toggle -->
                  <div
                    class="pointer-events-auto absolute top-4 left-4 flex items-center gap-3"
                  >
                    <div class="flex items-center gap-2 rounded-lg border border-white/30 bg-black/60 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white shadow-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <span>Press F or ESC to exit</span>
                    </div>
                    <button
                      @click="showMoveLog = !showMoveLog"
                      class="flex items-center gap-2 rounded-lg border border-white/30 bg-black/60 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white shadow-lg hover:bg-black/70 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path v-if="showMoveLog" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      <span>{{ showMoveLog ? 'Hide' : 'Show' }} Moves</span>
                    </button>
                  </div>
                </div>
              </div>
              <!-- Move log in fullscreen (conditionally visible) -->
              <div 
                v-if="showMoveLog" 
                class="w-96 h-full transition-all duration-300 ease-in-out"
              >
                <div class="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm p-4 h-full max-h-[80vh] flex flex-col">
                  <div class="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 class="text-xl font-semibold text-white">Move Log</h2>
                    <span class="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      {{ engineReady ? 'Live' : 'Booting' }}
                    </span>
                  </div>
                  <div class="flex-1 overflow-y-auto min-h-0">
                    <ol class="grid grid-cols-1 gap-y-2 text-base text-white/90 pb-4">
                      <li v-for="entry in moveLog" :key="entry.index" class="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <span class="text-sm font-semibold text-white/60 w-8 flex-shrink-0">{{ entry.index }}.</span>
                        <span class="font-mono text-white font-medium">{{ entry.white }}</span>
                        <span class="font-mono text-yellow-300 font-medium">{{ entry.black ?? '...' }}</span>
                      </li>
                    </ol>
                    <div v-if="moveLog.length === 0" class="text-white/60 text-base text-center py-12">
                      <div class="text-3xl mb-3">♟️</div>
                      <div>Moves will appear here as you play</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Normal layout (non-fullscreen) -->
          <div v-else>
            <div 
              class="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.35em]"
              :class="isFullscreen ? 'text-white/90' : 'text-[#021d94]/70'"
            >
              <span>AdNU Player</span>
              <span>Stockfish</span>
            </div>
            <div class="relative aspect-square" :class="{ 'w-full max-w-[80vh]': isFullscreen }">
              <div class="absolute inset-0 grid grid-cols-8 grid-rows-8">
                <button
                  v-for="visual in boardSquares"
                  :key="visual.square"
                  type="button"
                  class="relative flex items-center justify-center font-semibold transition focus:outline-none"
                  :class="[squareClass(visual), isFullscreen ? 'text-8xl xl:text-9xl' : 'text-3xl']"
                  @click="handleSquareClick(visual.square)"
                >
                  <span v-if="visual.piece" class="drop-shadow-sm">{{ pieceGlyph(visual.piece) }}</span>
                  <span
                    v-if="isLegalTarget(visual.square)"
                    class="absolute h-2.5 w-2.5 rounded-full bg-[#021d94]/70"
                  ></span>
                </button>
              </div>
              <div
                v-if="engineThinking"
                class="pointer-events-none absolute inset-x-8 top-4 flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-[#021d94]/80 shadow"
              >
                <span class="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#021d94]"></span>
                Stockfish is thinking...
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 space-y-3" :class="{ 'hidden': isFullscreen }">
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-4 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              @click="resetGame"
            >
              Start New Game
            </button>
            <button
              type="button"
              class="flex-1 rounded-full border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60"
              @click="undoLastMove"
            >
              Undo Move
            </button>
          </div>
          <!-- Fullscreen toggle button -->
          <button
            type="button"
            class="w-full rounded-full border border-[#021d94]/30 bg-white/90 px-4 py-2 text-sm font-semibold text-[#021d94] transition hover:border-[#021d94]/60 hover:bg-white flex items-center justify-center gap-2"
            @click="toggleFullscreen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
            <div class="text-left">
              <div>Fullscreen Mode</div>
              <div class="text-xs opacity-70">F = fullscreen • M = toggle moves</div>
            </div>
          </button>
        </div>
      </div>
      <div class="flex-1 space-y-6">
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Arena Status</h2>
            <span
              class="rounded-full border border-[#021d94]/30 bg-[#021d94]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#021d94]"
            >
              {{ engineReady ? 'Live' : 'Booting' }}
            </span>
          </div>
          <p class="mt-3 text-sm text-slate-600">{{ statusMessage }}</p>
          <div class="mt-5">
            <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/80">Move log</h3>
            <ol class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
              <li v-for="entry in moveLog" :key="entry.index" class="flex items-center gap-3">
                <span class="text-xs font-semibold text-slate-400">{{ entry.index }}.</span>
                <span>{{ entry.white }}</span>
                <span class="text-[#021d94]">{{ entry.black ?? '...' }}</span>
              </li>
            </ol>
          </div>
        </div>
        <div class="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-inner">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Recent matches</h2>
            <button
              type="button"
              class="text-xs font-semibold uppercase tracking-[0.25em] text-[#021d94]/70 hover:text-[#021d94]"
              @click="loadRecentMatches"
            >
              Refresh
            </button>
          </div>
          <p v-if="recentMatches.length === 0" class="mt-3 text-sm text-slate-500">
            Play a game to start filling your glassy match history.
          </p>
          <ul v-else class="mt-4 space-y-3 text-sm text-slate-700">
            <li
              v-for="match in recentMatches"
              :key="match.id"
              class="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-4 py-3"
            >
              <div>
                <p class="font-semibold text-slate-900">{{ matchLabel(match) }}</p>
                <p class="text-xs uppercase tracking-wide text-slate-500">
                  {{ formatTimestamp(match.completedAt) }} • {{ match.moves.length }} moves
                </p>
              </div>
              <span :class="resultBadgeClass(match.result)">{{ match.result }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, nextTick } from 'vue'
import { useAuth } from '~/composables/useAuth'
import type { AuthUser } from '~/composables/useAuth'

type WorkerConstructor = typeof Worker

interface MatchHistory {
  id: string
  moves: string[]
  result: 'white' | 'black' | 'draw'
  startedAt: string
  completedAt: string
  meta?: Record<string, unknown>
}

interface VisualSquare {
  square: Square
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null
  rankIndex: number
  fileIndex: number
}

const playerColor: 'w' = 'w'
const game = shallowRef(new Chess())
const fen = ref(game.value.fen())
const selectedSquare = ref<Square | null>(null)
const legalMoves = ref<Move[]>([])
const historySAN = ref<string[]>([])
const statusMessage = ref('Click a piece to begin your duel with Stockfish')
const engineReady = ref(false)
const engineThinking = ref(false)
const startedAt = ref(new Date().toISOString())
const recentMatches = ref<MatchHistory[]>([])
const isFullscreen = ref(false)
const showMoveLog = ref(true)
const chessBoard = ref<HTMLElement>()
const fullscreenHeaderEl = ref<HTMLElement | null>(null)

// Fullscreen sizing
const boardSize = ref(0)
const pieceSize = ref(0)
const dotSize = ref(0)
const PADDING = 48 // p-6 on fullscreen wrapper
const GAP = 24 // gap-6 between board and sidebar
const SIDEBAR_W = 384 // w-96 move log width
const CONTROLS_H = 80 // approximate height for controls overlay

const computeBoardSize = () => {
  if (!isFullscreen.value) return
  const headerH = (fullscreenHeaderEl.value?.offsetHeight || 0) + 16 // add mb-4
  const availW = window.innerWidth - (PADDING * 2) - (showMoveLog.value ? (GAP + SIDEBAR_W) : 0)
  const availH = window.innerHeight - (PADDING * 2) - headerH - CONTROLS_H
  const size = Math.max(320, Math.floor(Math.min(availW * 0.95, availH * 0.95)))
  boardSize.value = size
  const square = size / 8
  pieceSize.value = Math.floor(square * 0.75) // Larger pieces for better visibility
  dotSize.value = Math.max(8, Math.floor(square * 0.25))
}
const { user: authProfile, refresh: refreshAuth } = useAuth()

let engine: Worker | null = null

const files: Array<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'> = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = [8, 7, 6, 5, 4, 3, 2, 1]

const boardSquares = computed<VisualSquare[]>(() => {
  fen.value
  const board = game.value.board()
  const visuals: VisualSquare[] = []
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const rank = ranks[rankIndex]
    const row = board[rankIndex]
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

const moveLog = computed(() => {
  const pairs: Array<{ index: number; white: string; black?: string }> = []
  const moves = historySAN.value
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
  if (!engineReady.value) {
    return
  }
  if (engineThinking.value) {
    statusMessage.value = 'Hang tight - Stockfish is responding to your last move.'
    return
  }

  const piece = game.value.get(square)

  if (selectedSquare.value === square) {
    selectedSquare.value = null
    legalMoves.value = []
    return
  }

  if (!selectedSquare.value) {
    if (!piece || piece.color !== playerColor) {
      return
    }
    selectedSquare.value = square
    legalMoves.value = game.value.moves({ square, verbose: true })
    return
  }

  const move = legalMoves.value.find((candidate) => candidate.to === square)
  if (!move) {
    if (piece && piece.color === playerColor) {
      selectedSquare.value = square
      legalMoves.value = game.value.moves({ square, verbose: true })
    }
    return
  }

  makePlayerMove(move.from as Square, move.to as Square, move.promotion ?? 'q')
}

const makePlayerMove = (from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n') => {
  const move = game.value.move({ from, to, promotion })
  if (!move) {
    return
  }
  afterMove('white')
}

const afterMove = async (lastMover: 'white' | 'black') => {
  selectedSquare.value = null
  legalMoves.value = []
  fen.value = game.value.fen()
  historySAN.value = game.value.history()

  if (game.value.isGameOver()) {
    if (game.value.isCheckmate()) {
      await finalizeMatch(lastMover === 'white' ? 'white' : 'black', `${lastMover} delivers checkmate!`)
    } else {
      await finalizeMatch('draw', 'The duel fades into a draw.')
    }
    return
  }

  if (game.value.isCheck()) {
    statusMessage.value = lastMover === 'white' ? 'Stockfish is in check!' : 'You are in check!'
  } else {
    statusMessage.value = lastMover === 'white' ? 'Stockfish is calculating...' : 'Your move'
  }

  if (lastMover === 'white') {
    requestEngineMove()
  }
}

const requestEngineMove = () => {
  if (!engine || !engineReady.value) {
    return
  }
  engineThinking.value = true
  engine.postMessage(`position fen ${game.value.fen()}`)
  engine.postMessage('go movetime 2000')
}

const finalizeMatch = async (result: 'white' | 'black' | 'draw', message: string) => {
  engineThinking.value = false
  statusMessage.value = message
  try {
    const response = await $fetch<{ match: MatchHistory; user: AuthUser | null }>(
      '/api/matches',
      {
        method: 'POST',
        body: {
          moves: [...historySAN.value],
          result,
          startedAt: startedAt.value,
          completedAt: new Date().toISOString(),
          meta: { engine: 'stockfish', difficulty: 'movetime-2000ms' },
        },
      },
    )
    await loadRecentMatches()
    if (response.user) {
      authProfile.value = response.user
    } else {
      await refreshAuth()
    }
  } catch (error) {
    console.error('Failed to persist match', error)
  }
}

const undoLastMove = () => {
  if (engineThinking.value || historySAN.value.length === 0) {
    return
  }
  const movesBefore = historySAN.value.length
  game.value.undo()
  if (movesBefore % 2 === 0) {
    game.value.undo()
  }
  fen.value = game.value.fen()
  historySAN.value = game.value.history()
  statusMessage.value = 'Back to analysis. Your move.'
}

const resetGame = () => {
  game.value = new Chess()
  fen.value = game.value.fen()
  historySAN.value = []
  selectedSquare.value = null
  legalMoves.value = []
  startedAt.value = new Date().toISOString()
  statusMessage.value = 'Fresh board! You play the bubbly white pieces.'
  engineThinking.value = false
  if (engineReady.value && engine) {
    engine.postMessage('ucinewgame')
    engine.postMessage('isready')
  }
}

const loadRecentMatches = async () => {
  try {
    const response = await $fetch<{ matches: MatchHistory[] }>('/api/matches')
    recentMatches.value = response.matches
  } catch (error) {
    console.error('Unable to load matches', error)
  }
}

const handleEngineMessage = (payload: unknown) => {
  if (typeof payload !== 'string') {
    return
  }

  if (payload.includes('uciok')) {
    engine?.postMessage('isready')
    return
  }

  if (payload.includes('readyok')) {
    engineReady.value = true
    statusMessage.value = 'Stockfish is ready. Your move!'
    return
  }

  if (payload.startsWith('bestmove')) {
    const parts = payload.split(' ')
    const moveNotation = parts[1]
    engineThinking.value = false
    if (!moveNotation || moveNotation === '(none)' || moveNotation === '0000') {
      finalizeMatch('draw', 'Stockfish has no moves left. Draw!')
      return
    }
    const from = moveNotation.slice(0, 2) as Square
    const to = moveNotation.slice(2, 4) as Square
    const promotion = (moveNotation.slice(4, 5) || 'q') as 'q' | 'r' | 'b' | 'n'
    const move = game.value.move({ from, to, promotion })
    if (!move) {
      console.warn('Engine suggested illegal move', moveNotation)
      return
    }
    afterMove('black')
  }
}

const matchLabel = (match: MatchHistory) => {
  switch (match.result) {
    case 'white':
      return 'You defeated Stockfish'
    case 'black':
      return 'Stockfish claimed victory'
    default:
      return 'Drawn glass match'
  }
}

const resultBadgeClass = (result: MatchHistory['result']) => {
  const base = 'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide'
  if (result === 'white') {
    return `${base} bg-[#021d94]/15 text-[#021d94]`
  }
  if (result === 'black') {
    return `${base} bg-[#ffaa00]/15 text-[#b87400]`
  }
  return `${base} bg-slate-200/70 text-slate-600`
}

const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleString()
  } catch (error) {
    return timestamp
  }
}

const toggleFullscreen = async () => {
  if (!chessBoard.value) return
  
  try {
    if (!isFullscreen.value) {
      // Enter fullscreen
      if (chessBoard.value.requestFullscreen) {
        await chessBoard.value.requestFullscreen()
      } else if ((chessBoard.value as any).webkitRequestFullscreen) {
        await (chessBoard.value as any).webkitRequestFullscreen()
      } else if ((chessBoard.value as any).mozRequestFullScreen) {
        await (chessBoard.value as any).mozRequestFullScreen()
      }
      isFullscreen.value = true
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      }
      isFullscreen.value = false
    }
  } catch (error) {
    console.error('Failed to toggle fullscreen:', error)
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key.toLowerCase() === 'f') {
    event.preventDefault()
    toggleFullscreen()
  }
  if (event.key.toLowerCase() === 'm' && isFullscreen.value) {
    event.preventDefault()
    showMoveLog.value = !showMoveLog.value
  }
}

const handleFullscreenChange = () => {
  const isCurrentlyFullscreen = 
    document.fullscreenElement === chessBoard.value ||
    (document as any).webkitFullscreenElement === chessBoard.value ||
    (document as any).mozFullScreenElement === chessBoard.value
  
  isFullscreen.value = isCurrentlyFullscreen
}

const spawnEngine = async () => {
  engineReady.value = false
  engineThinking.value = false
  if (engine) {
    engine.terminate()
    engine = null
  }
  statusMessage.value = 'Booting Stockfish engine...'
  try {
    const { default: StockfishWorker } = (await import('stockfish/src/stockfish-nnue-16-single.js?worker')) as {
      default: WorkerConstructor
    }
    const worker = new StockfishWorker()
    worker.onmessage = (event: MessageEvent<string>) => {
      handleEngineMessage(event.data)
    }
    worker.onerror = (event) => {
      console.error('Stockfish worker error', event)
    }
    engine = worker
    engine.postMessage('uci')
  } catch (error) {
    console.error('Failed to initialise Stockfish', error)
    statusMessage.value = 'Unable to boot Stockfish engine. Check console logs.'
  }
}

onMounted(async () => {
  await loadRecentMatches()
  await spawnEngine()
  
  // Add keyboard event listener for fullscreen toggle
  document.addEventListener('keydown', handleKeyPress)
  
  // Add fullscreen change listeners
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)

  // Track viewport for fullscreen sizing
  window.addEventListener('resize', computeBoardSize)
  await nextTick()
  computeBoardSize()
})

onBeforeUnmount(() => {
  if (engine) {
    engine.postMessage('quit')
    engine.terminate()
    engine = null
  }
  
  // Clean up event listeners
  document.removeEventListener('keydown', handleKeyPress)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  window.removeEventListener('resize', computeBoardSize)
})

watch(isFullscreen, async (active) => {
  if (active) {
    await nextTick()
    computeBoardSize()
  }
})

watch(showMoveLog, () => {
  if (isFullscreen.value) computeBoardSize()
})
</script>



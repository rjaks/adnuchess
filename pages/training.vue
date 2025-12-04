<template>
  <div class="mx-auto max-w-6xl px-4 py-12 space-y-8">
    <header class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Training</p>
      <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">AI Coach: Learn on a live board</h1>
      <p class="max-w-3xl text-base text-slate-600 sm:text-lg">
        Click any piece to see its legal moves, follow the coach prompts, and play through the basics on a single board.
      </p>
    </header>

    <section class="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
      <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Board</p>
            <p class="text-sm text-slate-600">Turn: <span class="font-semibold text-[#021d94]">{{ turnLabel }}</span></p>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              @click="resetBoard"
            >
              Reset
            </button>
            <button
              type="button"
              class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              @click="undoMove"
              :disabled="!moveHistory.length"
            >
              Undo
            </button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-8 gap-px rounded-md border border-slate-200 bg-slate-200">
          <button
            v-for="square in flatBoard"
            :key="square.coord"
            type="button"
            class="relative aspect-square w-full text-center text-lg font-semibold"
            :class="[
              square.isDark ? 'bg-slate-100' : 'bg-white',
              square.coord === selectedSquare ? 'ring-2 ring-[#021d94]' : ''
            ]"
            @click="handleSquareClick(square.coord, square.pieceColor)"
          >
            <span
              v-if="legalTargets.includes(square.coord)"
              class="pointer-events-none absolute inset-0 m-auto h-3 w-3 rounded-full bg-[#021d94]/60 opacity-80"
            />
            <span
              v-if="square.piece"
              class="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-md border text-base font-bold"
              :class="square.pieceColor === 'w' ? 'bg-white text-[#021d94] border-slate-300' : 'bg-slate-800 text-white border-slate-700'"
            >
              {{ square.symbol }}
            </span>
            <span class="absolute left-1 top-1 text-[10px] font-semibold text-slate-400" v-if="square.file === 'a'">
              {{ square.rank }}
            </span>
            <span class="absolute bottom-1 right-1 text-[10px] font-semibold text-slate-400" v-if="square.rank === 1">
              {{ square.file }}
            </span>
          </button>
        </div>
      </article>

      <aside class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Coach Console</p>
              <p class="text-sm text-slate-600">Basics and move guidance.</p>
            </div>
            <span class="rounded-full bg-[#021d94]/10 px-3 py-1 text-xs font-semibold text-[#021d94]">Live</span>
          </div>
          <div class="mt-4 space-y-3">
            <div
              v-for="topic in coachingTopics"
              :key="topic.id"
              class="rounded-md border border-slate-200 p-3"
              :class="activeTopic === topic.id ? 'bg-[#021d94]/5 border-[#021d94]/30' : 'bg-white'"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between text-left"
                @click="activeTopic = topic.id"
              >
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ topic.tag }}</p>
                  <p class="text-sm font-semibold text-slate-800">{{ topic.title }}</p>
                </div>
                <span class="text-xs font-semibold text-[#021d94]">Focus</span>
              </button>
              <ul class="mt-2 space-y-1 text-xs text-slate-600" v-if="activeTopic === topic.id">
                <li v-for="point in topic.points" :key="point" class="flex items-start gap-2">
                  <span class="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00]"></span>
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Coach Notes</p>
            <button
              type="button"
              class="text-xs font-semibold text-[#021d94] hover:underline"
              @click="clearNotes"
            >
              Clear
            </button>
          </div>
          <ul class="mt-3 space-y-2 text-sm text-slate-700 max-h-[260px] overflow-y-auto">
            <li v-for="note in coachNotes" :key="note.id" class="rounded-md bg-slate-50 px-3 py-2">
              <p class="text-xs font-semibold text-slate-500">{{ note.label }}</p>
              <p>{{ note.text }}</p>
            </li>
          </ul>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Chess } from 'chess.js'
import { computed, ref } from 'vue'

type Note = { id: string; label: string; text: string }
type Topic = { id: string; title: string; tag: string; points: string[] }

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const chess = ref(new Chess())
const board = ref(chess.value.board())
const selectedSquare = ref<string | null>(null)
const legalTargets = ref<string[]>([])
const moveHistory = ref<string[]>([])

const coachNotes = ref<Note[]>([
  {
    id: 'welcome',
    label: 'Coach',
    text: 'Pick any piece to see where it can move. Start with a pawn to learn its forward and capture rules.'
  }
])

const coachingTopics: Topic[] = [
  {
    id: 'pawn',
    title: 'Pawns (the “prawn”)',
    tag: 'Basics',
    points: [
      'Move forward 1; from the start they may go 2.',
      'Capture diagonally forward; never backward.',
      'Reaching the last rank lets you promote to a stronger piece.'
    ]
  },
  {
    id: 'knight',
    title: 'Knights',
    tag: 'Basics',
    points: [
      'L-shape: two squares in one direction, then one sideways.',
      'Only piece that can hop over others.',
      'Great for jumping into outposts in the center.'
    ]
  },
  {
    id: 'king',
    title: 'King safety',
    tag: 'Basics',
    points: [
      'Keep the king behind pawns; castle early when possible.',
      'Kings move one square in any direction.',
      'Never leave the king in check; every move must end safe.'
    ]
  }
]

const activeTopic = ref<string>(coachingTopics[0]?.id ?? '')

const flatBoard = computed(() => {
  return board.value.flatMap((rank, rankIndex) => {
    const displayRank = 8 - rankIndex
    return rank.map((square, fileIndex) => {
      const coord = `${files[fileIndex]}${displayRank}`
      const isDark = (rankIndex + fileIndex) % 2 === 1
      const pieceColor = square?.color ?? null
      const symbol = square ? (square.color === 'w' ? square.type.toUpperCase() : square.type) : ''
      return { coord, isDark, piece: square, pieceColor, symbol, rank: displayRank, file: files[fileIndex] }
    })
  })
})

const turnLabel = computed(() => (chess.value.turn() === 'w' ? 'White to move' : 'Black to move'))

const addNote = (text: string, label = 'Coach') => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`
  coachNotes.value = [{ id, label, text }, ...coachNotes.value].slice(0, 30)
}

const refreshBoard = () => {
  board.value = chess.value.board()
}

const resetBoard = () => {
  chess.value = new Chess()
  selectedSquare.value = null
  legalTargets.value = []
  moveHistory.value = []
  refreshBoard()
  addNote('Board reset. Try leading with a center pawn (e4 or d4) to claim space.')
}

const undoMove = () => {
  if (!moveHistory.value.length) return
  chess.value.undo()
  moveHistory.value.pop()
  selectedSquare.value = null
  legalTargets.value = []
  refreshBoard()
  addNote('Move undone. Re-evaluate and try a safer idea.')
}

const handleSquareClick = (coord: string, pieceColor: 'w' | 'b' | null) => {
  // Select a piece
  if (!selectedSquare.value) {
    if (!pieceColor) {
      addNote('Empty square. Select a piece to see its options.', 'Guide')
      return
    }
    const turn = chess.value.turn()
    if (turn !== pieceColor) {
      addNote(`It is ${turn === 'w' ? 'White' : 'Black'} to move. Choose your own piece.`, 'Guide')
      return
    }
    selectedSquare.value = coord
    const moves = chess.value.moves({ square: coord, verbose: true })
    legalTargets.value = moves.map((m) => m.to)
    addNote(`Selected ${coord}. Legal targets: ${legalTargets.value.join(', ') || 'none'}.`)
    return
  }

  // Attempt a move
  const move = chess.value.move({ from: selectedSquare.value, to: coord, promotion: 'q' })
  if (move) {
    moveHistory.value.push(`${move.from}-${move.to}`)
    addNote(`Moved ${move.piece.toUpperCase()} from ${move.from} to ${move.to}.`, 'Guide')
    selectedSquare.value = null
    legalTargets.value = []
    refreshBoard()
    if (chess.value.in_check()) {
      addNote('Check detected. Cover or move your king to stay safe.', 'Coach')
    }
  } else {
    addNote('Illegal move. Follow the highlighted targets or pick a new piece.', 'Guide')
    selectedSquare.value = null
    legalTargets.value = []
  }
}

const clearNotes = () => {
  coachNotes.value = []
}
</script>

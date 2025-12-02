<template>
  <div class="rounded-3xl border-4 border-white/70 bg-gradient-to-br from-amber-50 to-blue-50 p-10 shadow-inner flex-1 max-w-7xl">
    <div class="aspect-square w-full">
      <!-- Board with coordinates -->
      <div class="relative">
        <!-- File labels (A-H) at top -->
        <div class="flex mb-2">
          <div class="w-8"></div> <!-- Spacer for left rank labels -->
          <div class="flex-1 grid grid-cols-8 gap-0">
            <span 
              v-for="file in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']" 
              :key="file" 
              class="text-center text-sm font-bold text-[#021d94] flex items-center justify-center"
            >
              {{ file }}
            </span>
          </div>
          <div class="w-8"></div> <!-- Spacer for right rank labels -->
        </div>
        
        <div class="flex gap-2">
          <!-- Rank labels (8-1) on left -->
          <div class="flex flex-col justify-between w-8">
            <span 
              v-for="rank in (myColor === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8])" 
              :key="rank" 
              class="flex items-center justify-center text-sm font-bold text-[#021d94] aspect-square"
            >
              {{ rank }}
            </span>
          </div>
          
          <!-- Chess board -->
          <div class="flex-1 overflow-hidden shadow-2xl border-8 border-[#021d94]/30 relative">
            <!-- SVG overlay for arrows -->
            <svg
              class="absolute inset-0 pointer-events-none z-10"
              style="width: 100%; height: 100%;"
            >
              <defs>
                <marker
                  v-for="color in ['green', 'red', 'yellow', 'blue']"
                  :key="`arrowhead-${color}`"
                  :id="`arrowhead-${color}`"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" :fill="getArrowColorHex(color)" />
                </marker>
              </defs>
              
              <!-- Draw all arrows -->
              <line
                v-for="(arrow, index) in arrows"
                :key="`arrow-${index}`"
                :x1="getSquareCenter(arrow.from).x + '%'"
                :y1="getSquareCenter(arrow.from).y + '%'"
                :x2="getSquareCenter(arrow.to).x + '%'"
                :y2="getSquareCenter(arrow.to).y + '%'"
                :stroke="getArrowColor(arrow.color)"
                stroke-width="8"
                stroke-linecap="round"
                :marker-end="`url(#arrowhead-${arrow.color})`"
                opacity="0.8"
              />
            </svg>
            
            <div class="grid grid-cols-8 gap-0 h-full w-full">
              <div
                v-for="(square, index) in boardSquares"
                :key="index"
                :class="[
                  'aspect-square flex items-center justify-center cursor-pointer transition-all duration-200 relative',
                  getSquareColor(square.file, square.rank),
                  square.isSelected ? 'ring-4 ring-[#021d94] ring-inset z-10' : '',
                  square.isLastMove && !square.isSelected ? 'ring-4 ring-[#ffaa00] ring-inset' : '',
                  !square.isSelected && !square.isLastMove ? 'hover:brightness-90' : ''
                ]"
                @click="handleSquareClick(square)"
                @contextmenu.prevent="handleRightMouseDown($event, square)"
                @mousedown.right.prevent="handleRightMouseDown($event, square)"
                @mouseup.right.prevent="handleRightMouseUp($event, square)"
                @mouseenter="handleMouseEnter(square)"
                @dragover.prevent="handleDragOver($event, square)"
                @drop="handleDrop($event, square)"
              >
                <!-- Square highlight overlay -->
                <div
                  v-if="getSquareHighlight(square.file + square.rank)"
                  :class="[
                    'absolute inset-0 pointer-events-none z-[5]',
                    getHighlightClass(getSquareHighlight(square.file + square.rank)!)
                  ]"
                ></div>
                
                <!-- Legal move indicator -->
                <div
                  v-if="square.isLegalMove && !square.piece"
                  class="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div class="w-4 h-4 rounded-full bg-[#021d94]/50"></div>
                </div>
                
                <!-- Capture indicator - light red overlay -->
                <div
                  v-else-if="square.isLegalMove && square.piece"
                  class="absolute inset-0 bg-red-400/40 pointer-events-none"
                ></div>
                
                <!-- Chess piece -->
                <span 
                  v-if="square.piece" 
                  :draggable="canDragPiece(square)"
                  @dragstart="handleDragStart($event, square)"
                  @dragend="handleDragEnd"
                  :class="[
                    'select-none font-bold',
                    'text-6xl leading-none',
                    canDragPiece(square) ? 'cursor-move' : 'cursor-default'
                  ]"
                  :style="square.piece.color === 'w'
                    ? 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; paint-order: stroke fill; -webkit-text-stroke: 2px rgba(0,0,0,0.8); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));' 
                    : 'color: #1e293b !important; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));'"
                >
                  {{ getPieceSymbol(square.piece.type, square.piece.color) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Rank labels (8-1) on right -->
          <div class="flex flex-col justify-between w-8">
            <span 
              v-for="rank in (myColor === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8])" 
              :key="rank + '-right'" 
              class="flex items-center justify-center text-sm font-bold text-[#021d94] aspect-square"
            >
              {{ rank }}
            </span>
          </div>
        </div>
        
        <!-- File labels (A-H) at bottom -->
        <div class="flex mt-2">
          <div class="w-8"></div> <!-- Spacer for left rank labels -->
          <div class="flex-1 grid grid-cols-8 gap-0">
            <span 
              v-for="file in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']" 
              :key="file + '-bottom'" 
              class="text-center text-sm font-bold text-[#021d94] flex items-center justify-center"
            >
              {{ file }}
            </span>
          </div>
          <div class="w-8"></div> <!-- Spacer for right rank labels -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
type ArrowColor = 'green' | 'red' | 'yellow' | 'blue'

type BoardSquare = {
  file: string
  rank: number
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null
  isSelected: boolean
  isLegalMove: boolean
  isLastMove: boolean
}

type Arrow = { from: string; to: string; color: ArrowColor }
type Highlight = { square: string; color: ArrowColor }

interface Props {
  boardSquares: BoardSquare[]
  myColor: 'white' | 'black'
  arrows: Arrow[]
  highlights: Highlight[]
  canInteract: boolean
  reviewMode: boolean
}

interface Emits {
  (e: 'square-click', square: BoardSquare): void
  (e: 'right-mouse-down', event: MouseEvent, square: BoardSquare): void
  (e: 'right-mouse-up', event: MouseEvent, square: BoardSquare): void
  (e: 'mouse-enter', square: BoardSquare): void
  (e: 'drag-start', event: DragEvent, square: BoardSquare): void
  (e: 'drag-over', event: DragEvent, square: BoardSquare): void
  (e: 'drop', event: DragEvent, square: BoardSquare): void
  (e: 'drag-end'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
  
  if (color === 'w' || color === 'b') {
    const colorPieces = pieces[color]
    if (type in colorPieces) {
      return colorPieces[type as keyof typeof colorPieces]
    }
  }
  
  return ''
}

const getSquareHighlight = (square: string): ArrowColor | null => {
  const highlight = props.highlights.find(h => h.square === square)
  return highlight ? highlight.color : null
}

const getHighlightClass = (color: ArrowColor): string => {
  const classes = {
    green: 'bg-green-500/40',
    red: 'bg-red-500/40',
    yellow: 'bg-yellow-500/40',
    blue: 'bg-blue-500/40'
  }
  return classes[color]
}

const getArrowColor = (color: ArrowColor): string => {
  const colors = {
    green: 'rgba(34, 197, 94, 0.8)',
    red: 'rgba(239, 68, 68, 0.8)',
    yellow: 'rgba(234, 179, 8, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)'
  }
  return colors[color]
}

const getArrowColorHex = (color: string): string => {
  const colors: Record<string, string> = {
    green: 'rgba(34, 197, 94, 0.8)',
    red: 'rgba(239, 68, 68, 0.8)',
    yellow: 'rgba(234, 179, 8, 0.8)',
    blue: 'rgba(59, 130, 246, 0.8)'
  }
  return colors[color] || 'rgba(34, 197, 94, 0.8)'
}

const getSquareCenter = (square: string): { x: number; y: number } => {
  const file = square[0]
  const rank = parseInt(square[1] || '1')
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const fileIndex = files.indexOf(file || 'a')
  
  let x, y
  if (props.myColor === 'white') {
    x = (fileIndex + 0.5) * 12.5
    y = (8 - rank + 0.5) * 12.5
  } else {
    x = (7 - fileIndex + 0.5) * 12.5
    y = (rank - 0.5) * 12.5
  }
  
  return { x, y }
}

const canDragPiece = (square: BoardSquare) => {
  if (props.reviewMode) return false
  if (!square.piece) return false
  
  const pieceColor = square.piece.color === 'w' ? 'white' : 'black'
  return pieceColor === props.myColor && props.canInteract
}

// Event handlers
const handleSquareClick = (square: BoardSquare) => {
  emit('square-click', square)
}

const handleRightMouseDown = (event: MouseEvent, square: BoardSquare) => {
  emit('right-mouse-down', event, square)
}

const handleRightMouseUp = (event: MouseEvent, square: BoardSquare) => {
  emit('right-mouse-up', event, square)
}

const handleMouseEnter = (square: BoardSquare) => {
  emit('mouse-enter', square)
}

const handleDragStart = (event: DragEvent, square: BoardSquare) => {
  emit('drag-start', event, square)
}

const handleDragOver = (event: DragEvent, square: BoardSquare) => {
  emit('drag-over', event, square)
}

const handleDrop = (event: DragEvent, square: BoardSquare) => {
  emit('drop', event, square)
}

const handleDragEnd = () => {
  emit('drag-end')
}
</script>

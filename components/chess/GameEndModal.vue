<template>
  <Transition name="modal-fade">
    <div 
      v-if="isVisible"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <!-- Modal Card -->
      <Transition name="modal-scale">
        <div 
          v-if="isVisible"
          class="relative w-full max-w-md"
        >
          <div 
            class="rounded-3xl border-2 p-8 shadow-2xl"
            :class="modalCardClass"
          >
            <!-- Close Button -->
            <button
              @click="$emit('close')"
              class="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 hover:rotate-90"
              aria-label="Close"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Icon -->
            <div class="mb-6 flex justify-center">
              <div 
                class="flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
                :class="iconBackgroundClass"
              >
                <!-- Victory Icon (Trophy) -->
                <svg 
                  v-if="isVictory"
                  class="h-14 w-14"
                  :class="iconColorClass"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>

                <!-- Defeat Icon (Sad Face) -->
                <svg 
                  v-else-if="!isDraw"
                  class="h-14 w-14"
                  :class="iconColorClass"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <!-- Draw Icon (Handshake) -->
                <svg 
                  v-else
                  class="h-14 w-14"
                  :class="iconColorClass"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>

            <!-- Title -->
            <h2 
              class="mb-2 text-center text-3xl font-bold"
              :class="titleColorClass"
            >
              {{ title }}
            </h2>

            <!-- Result Message -->
            <p 
              class="mb-6 text-center text-lg font-medium"
              :class="messageColorClass"
            >
              {{ resultMessage }}
            </p>

            <!-- Player Info -->
            <div class="mb-6 space-y-3">
              <!-- Winner -->
              <div 
                v-if="!isDraw"
                class="flex items-center justify-between rounded-2xl p-4"
                :class="winnerBackgroundClass"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/30">
                    <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white/80">Winner</p>
                    <p class="text-lg font-bold text-white">{{ winnerName }}</p>
                  </div>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-bold uppercase bg-white/20 text-white">
                  {{ winnerColor }}
                </span>
              </div>

              <!-- Draw - Both Players -->
              <div 
                v-else
                class="rounded-2xl p-4"
                :class="drawBackgroundClass"
              >
                <p class="text-center text-sm font-medium text-white/80 mb-2">Both Players</p>
                <div class="flex justify-center gap-4">
                  <span class="rounded-full px-4 py-2 text-sm font-bold bg-white/20 text-white">
                    {{ player1Name }}
                  </span>
                  <span class="rounded-full px-4 py-2 text-sm font-bold bg-white/20 text-white">
                    {{ player2Name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
              <!-- Primary Action: New Match -->
              <button
                @click="$emit('rematch')"
                class="w-full rounded-xl py-3 px-4 font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                :class="primaryButtonClass"
              >
                <span class="flex items-center justify-center gap-2">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New Match
                </span>
              </button>

              <!-- Secondary Action: View Analysis -->
              <button
                @click="$emit('view-analysis')"
                class="w-full rounded-xl border-2 py-3 px-4 font-semibold transition-all hover:scale-105 active:scale-95"
                :class="secondaryButtonClass"
              >
                <span class="flex items-center justify-center gap-2">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Analysis
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isVisible: boolean
  winner: 'white' | 'black' | 'draw'
  result: string
  winnerName: string
  loserName: string
  myColor: 'white' | 'black'
  player1Name?: string
  player2Name?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'view-analysis'): void
  (e: 'rematch'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Determine if current player won
const isVictory = computed(() => {
  return props.winner === props.myColor && props.winner !== 'draw'
})

const isDraw = computed(() => {
  return props.winner === 'draw'
})

// Title based on result
const title = computed(() => {
  if (isDraw.value) return 'Draw!'
  if (isVictory.value) return 'Victory!'
  return 'Defeat'
})

// Result message
const resultMessage = computed(() => {
  switch (props.result) {
    case 'checkmate':
      return isDraw.value ? 'Game ended in stalemate' : 'Checkmate!'
    case 'stalemate':
      return 'Stalemate - No legal moves available'
    case 'resignation':
      return `${props.loserName} resigned`
    case 'timeout':
      return `${props.loserName} ran out of time`
    case 'agreement':
      return 'Draw agreed by both players'
    case 'abandonment':
      return `${props.loserName} abandoned the game`
    default:
      return isDraw.value ? 'Game ended in a draw' : 'Game Over'
  }
})

// Styling classes based on result
const modalCardClass = computed(() => {
  if (isVictory.value) {
    return 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400'
  }
  if (isDraw.value) {
    return 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400'
  }
  return 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400'
})

const iconBackgroundClass = computed(() => {
  if (isVictory.value) return 'bg-green-400/30 border-2 border-green-300'
  if (isDraw.value) return 'bg-blue-400/30 border-2 border-blue-300'
  return 'bg-red-400/30 border-2 border-red-300'
})

const iconColorClass = computed(() => {
  return 'text-white'
})

const titleColorClass = computed(() => {
  return 'text-white drop-shadow-lg'
})

const messageColorClass = computed(() => {
  return 'text-white/90'
})

const winnerBackgroundClass = computed(() => {
  if (isVictory.value) {
    return 'bg-green-600/40 border-2 border-green-400/50'
  }
  return 'bg-white/20 border-2 border-white/30'
})

const drawBackgroundClass = computed(() => {
  return 'bg-blue-600/40 border-2 border-blue-400/50'
})

const primaryButtonClass = computed(() => {
  if (isVictory.value) {
    return 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-400'
  }
  if (isDraw.value) {
    return 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-400'
  }
  return 'bg-rose-600 hover:bg-rose-700 focus:ring-4 focus:ring-rose-400'
})

const secondaryButtonClass = computed(() => {
  return 'bg-white/10 border-white/40 text-white hover:bg-white/20 focus:ring-4 focus:ring-white/20'
})

const winnerColor = computed(() => {
  return props.winner === 'white' ? 'White' : 'Black'
})
</script>

<style scoped>
/* Modal fade transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Modal scale transition */
.modal-scale-enter-active {
  transition: all 0.3s ease;
}

.modal-scale-leave-active {
  transition: all 0.2s ease;
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>

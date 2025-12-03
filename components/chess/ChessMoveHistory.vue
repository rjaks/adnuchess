<template>
  <div class="rounded-3xl border border-white/70 bg-gradient-to-br from-amber-50 to-blue-50 p-4 shadow-inner">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-semibold text-[#021d94]">Moves</h4>
      <div v-if="reviewMode" class="text-xs font-medium text-[#021d94] bg-white/60 px-2 py-1 rounded">
        {{ (reviewMoveIndex ?? -1) + 1 }}/{{ moveHistory.length }}
      </div>
    </div>
    
    <!-- Scrollable Move History - Limited Height -->
    <div class="overflow-y-auto mb-3" style="max-height: 200px;">
      <div class="space-y-1">
        <!-- Group moves in pairs (white and black) -->
        <div 
          v-for="moveNumber in Math.ceil(moveHistory.length / 2)" 
          :key="moveNumber"
          class="flex items-center gap-2 text-sm"
        >
          <!-- Move number -->
          <span class="font-semibold text-[#021d94] w-8 flex-shrink-0">
            {{ moveNumber }}.
          </span>
          
          <!-- White's move -->
          <span 
            @click="$emit('go-to-move', (moveNumber - 1) * 2)"
            :class="[
              'font-medium text-slate-700 px-3 py-1 rounded flex-1 cursor-pointer transition',
              reviewMode && reviewMoveIndex === (moveNumber - 1) * 2 
                ? 'bg-[#021d94] text-white' 
                : 'bg-white/60 hover:bg-white/80'
            ]"
          >
            {{ moveHistory[(moveNumber - 1) * 2] }}
          </span>
          
          <!-- Black's move (if exists) -->
          <span 
            v-if="(moveNumber - 1) * 2 + 1 < moveHistory.length"
            @click="$emit('go-to-move', (moveNumber - 1) * 2 + 1)"
            :class="[
              'font-medium text-slate-700 px-3 py-1 rounded flex-1 cursor-pointer transition',
              reviewMode && reviewMoveIndex === (moveNumber - 1) * 2 + 1
                ? 'bg-[#021d94] text-white'
                : 'bg-white/60 hover:bg-white/80'
            ]"
          >
            {{ moveHistory[(moveNumber - 1) * 2 + 1] }}
          </span>
          <span v-else class="flex-1"></span>
        </div>
      </div>
    </div>
    
    <!-- Navigation Buttons -->
    <div class="grid grid-cols-3 gap-2">
      <button
        @click="$emit('previous-move')"
        :disabled="reviewMode && reviewMoveIndex === -1"
        class="flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="text-xs font-semibold text-[#021d94]">Prev</span>
      </button>
      
      <button
        @click="$emit('exit-review')"
        :disabled="!reviewMode"
        class="flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
        title="Exit review mode"
      >
        <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span class="text-xs font-semibold text-[#021d94]">Exit</span>
      </button>
      
      <button
        @click="$emit('next-move')"
        :disabled="!reviewMode"
        class="flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg bg-white/80 hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span class="text-xs font-semibold text-[#021d94]">Next</span>
        <svg class="w-5 h-5 text-[#021d94]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  moveHistory: string[]
  reviewMode: boolean
  reviewMoveIndex: number | null
}

interface Emits {
  (e: 'go-to-move', index: number): void
  (e: 'previous-move'): void
  (e: 'next-move'): void
  (e: 'exit-review'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

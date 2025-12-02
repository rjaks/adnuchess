<template>
  <div 
    class="rounded-2xl border p-4 transition-all duration-300"
    :class="clockContainerClass"
  >
    <div class="flex items-center justify-between">      <!-- Player Info -->
      <div class="flex items-center gap-3">
        <div 
          class="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full ring-2 ring-offset-2"
          :class="avatarClass"
        >
          <img 
            v-if="avatarUrl && !imageError" 
            :src="avatarUrl" 
            :alt="playerName"
            class="h-full w-full object-cover"
            @error="handleImageError"
          />
          <span 
            v-else
            class="text-lg font-bold"
          >
            {{ playerInitial }}
          </span>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ playerName }}</p>
          <p class="text-xs text-slate-600">{{ playerColor }}</p>
        </div>
      </div>

      <!-- Timer Display -->
      <div 
        class="relative flex items-center justify-center"
        :class="{ 'animate-pulse': status === 'critical' && isActive }"
      >
        <div 
          class="rounded-xl px-4 py-2 text-center transition-all duration-200"
          :class="timerDisplayClass"
        >
          <div 
            class="font-mono text-2xl font-bold tabular-nums"
            :class="timeTextClass"
          >
            {{ displayTime }}
          </div>
          <!-- Increment indicator -->
          <div 
            v-if="increment > 0" 
            class="mt-0.5 text-xs font-medium"
            :class="incrementTextClass"
          >
            +{{ increment }}s
          </div>
        </div>
        
        <!-- Active indicator (pulsing ring) -->
        <div 
          v-if="isActive && status !== 'critical'"
          class="absolute inset-0 -m-1 rounded-xl border-2 animate-pulse"
          :class="activeRingClass"
        ></div>
      </div>
    </div>

    <!-- Low time warning bar -->
    <div 
      v-if="isActive && (status === 'low' || status === 'critical')" 
      class="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
      :class="warningBarClass"
    >
      <svg 
        class="h-4 w-4" 
        :class="warningIconClass"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span class="text-xs font-semibold" :class="warningTextClass">
        {{ warningMessage }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type TimeStatus = 'normal' | 'low' | 'critical'

interface Props {
  displayTime: string
  status: TimeStatus
  isActive: boolean
  playerName: string
  playerColor: 'White' | 'Black'
  increment?: number
  avatarUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  increment: 0,
  avatarUrl: undefined
})

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const playerInitial = computed(() => {
  return props.playerName.charAt(0).toUpperCase()
})

// Container styling based on active state
const clockContainerClass = computed(() => {
  if (props.isActive) {
    if (props.status === 'critical') {
      return 'border-red-400 bg-red-50 shadow-lg ring-2 ring-red-300'
    }
    if (props.status === 'low') {
      return 'border-yellow-400 bg-yellow-50 shadow-md ring-2 ring-yellow-300'
    }
    return 'border-[#021d94]/60 bg-[#021d94]/5 shadow-md ring-2 ring-[#021d94]/40'
  }
  return 'border-white/70 bg-white/40'
})

// Avatar styling
const avatarClass = computed(() => {
  if (props.playerColor === 'White') {
    return 'bg-white border-2 border-slate-300 text-slate-700'
  }
  return 'bg-slate-800 border-2 border-slate-600 text-white'
})

// Timer display background
const timerDisplayClass = computed(() => {
  if (!props.isActive) {
    return 'bg-white/60'
  }
  
  if (props.status === 'critical') {
    return 'bg-red-100 border border-red-300'
  }
  if (props.status === 'low') {
    return 'bg-yellow-100 border border-yellow-300'
  }
  return 'bg-gradient-to-br from-[#021d94]/10 to-[#ffaa00]/10 border border-[#021d94]/30'
})

// Time text color
const timeTextClass = computed(() => {
  if (props.status === 'critical') {
    return 'text-red-700'
  }
  if (props.status === 'low') {
    return 'text-yellow-800'
  }
  if (props.isActive) {
    return 'text-[#021d94]'
  }
  return 'text-slate-700'
})

// Increment text color
const incrementTextClass = computed(() => {
  if (props.status === 'critical') {
    return 'text-red-600'
  }
  if (props.status === 'low') {
    return 'text-yellow-700'
  }
  return 'text-slate-600'
})

// Active pulsing ring
const activeRingClass = computed(() => {
  if (props.status === 'low') {
    return 'border-yellow-400'
  }
  return 'border-[#021d94]'
})

// Warning bar styling
const warningBarClass = computed(() => {
  if (props.status === 'critical') {
    return 'bg-red-100 border border-red-300'
  }
  return 'bg-yellow-100 border border-yellow-300'
})

const warningIconClass = computed(() => {
  if (props.status === 'critical') {
    return 'text-red-600'
  }
  return 'text-yellow-600'
})

const warningTextClass = computed(() => {
  if (props.status === 'critical') {
    return 'text-red-700'
  }
  return 'text-yellow-700'
})

const warningMessage = computed(() => {
  if (props.status === 'critical') {
    return 'Critical time! Move quickly!'
  }
  return 'Running low on time'
})
</script>

<style scoped>
/* Custom pulse animation for critical time */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>

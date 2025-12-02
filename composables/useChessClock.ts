import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * Composable for managing chess clock display with local ticking
 * Syncs with server-authoritative time from Convex subscriptions
 */

export interface ChessClockState {
  whiteTimeMs: number
  blackTimeMs: number
  currentTurn: 'white' | 'black'
  lastMoveTimestamp: number | null
  gameStartTimestamp: number | null
  isGameActive: boolean
}

export interface ChessClockDisplay {
  whiteDisplayMs: Ref<number>
  blackDisplayMs: Ref<number>
  whiteFormatted: Ref<string>
  blackFormatted: Ref<string>
  whiteStatus: Ref<'normal' | 'low' | 'critical'>
  blackStatus: Ref<'normal' | 'low' | 'critical'>
  isWhiteTicking: Ref<boolean>
  isBlackTicking: Ref<boolean>
}

/**
 * Format milliseconds to MM:SS or M:SS format
 */
export function formatTime(ms: number): string {
  if (ms < 0) return '0:00'
  
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Determine time status for styling
 */
export function getTimeStatus(ms: number, baseTimeMs: number): 'normal' | 'low' | 'critical' {
  if (ms <= 10000) return 'critical' // 10 seconds or less
  if (ms <= 30000) return 'low' // 30 seconds or less
  if (ms <= baseTimeMs * 0.2) return 'low' // Less than 20% of starting time
  return 'normal'
}

/**
 * Main composable for chess clock
 */
export function useChessClock(
  clockState: Ref<ChessClockState | null>,
  baseTimeMs: number = 300000 // Default 5 minutes for status calculation
): ChessClockDisplay {
  // Local display state (updated every 100ms for smooth ticking)
  const whiteDisplayMs = ref(0)
  const blackDisplayMs = ref(0)
  
  // Track last sync time to calculate local elapsed time
  const lastSyncTime = ref(Date.now())
  
  let tickInterval: ReturnType<typeof setInterval> | null = null  /**
   * Sync local display with server state
   * Server times represent the time remaining at lastMoveTimestamp
   * We need to deduct elapsed time for the active player
   */
  const syncWithServer = () => {
    if (!clockState.value) return
    
    const now = Date.now()
    lastSyncTime.value = now
    
    // Clock hasn't started yet (waiting for White's first move)
    if (clockState.value.lastMoveTimestamp === 0) {
      whiteDisplayMs.value = clockState.value.whiteTimeMs
      blackDisplayMs.value = clockState.value.blackTimeMs
      console.log('[Clock Sync] Clock not started yet - waiting for White\'s first move')
      return
    }
    
    // For inactive player, use server time directly
    // For active player, deduct time elapsed since last move
    if (clockState.value.isGameActive && clockState.value.lastMoveTimestamp) {
      const elapsedSinceLastMove = now - clockState.value.lastMoveTimestamp
      
      if (clockState.value.currentTurn === 'white') {
        // White is active - deduct elapsed time
        whiteDisplayMs.value = Math.max(0, clockState.value.whiteTimeMs - elapsedSinceLastMove)
        // Black is inactive - use server time
        blackDisplayMs.value = clockState.value.blackTimeMs
      } else {
        // White is inactive - use server time
        whiteDisplayMs.value = clockState.value.whiteTimeMs
        // Black is active - deduct elapsed time
        blackDisplayMs.value = Math.max(0, clockState.value.blackTimeMs - elapsedSinceLastMove)
      }
    } else {
      // Game not started or no last move yet - use server times directly
      whiteDisplayMs.value = clockState.value.whiteTimeMs
      blackDisplayMs.value = clockState.value.blackTimeMs
    }
    
    console.log('[Clock Sync] Synced with server:', {
      serverWhite: clockState.value.whiteTimeMs,
      serverBlack: clockState.value.blackTimeMs,
      displayWhite: whiteDisplayMs.value,
      displayBlack: blackDisplayMs.value,
      currentTurn: clockState.value.currentTurn,
      lastMoveTimestamp: clockState.value.lastMoveTimestamp,
      elapsedSinceLastMove: clockState.value.lastMoveTimestamp ? now - clockState.value.lastMoveTimestamp : 0
    })
  }
  /**
   * Local tick function (runs every 100ms for smooth countdown)
   */
  const tick = () => {
    if (!clockState.value || !clockState.value.isGameActive) return
    
    // Don't tick if clock hasn't started yet (waiting for White's first move)
    if (clockState.value.lastMoveTimestamp === 0) return
    
    const now = Date.now()
    const elapsed = now - lastSyncTime.value
    
    // Deduct time from the player whose turn it is
    if (clockState.value.currentTurn === 'white') {
      whiteDisplayMs.value = Math.max(0, whiteDisplayMs.value - 100)
    } else {
      blackDisplayMs.value = Math.max(0, blackDisplayMs.value - 100)
    }
    
    // Resync every 5 seconds to prevent drift
    if (elapsed > 5000) {
      syncWithServer()
    }
  }

  /**
   * Start the local ticker
   */
  const startTicking = () => {
    if (tickInterval) return
    tickInterval = setInterval(tick, 100) // Tick every 100ms
  }

  /**
   * Stop the local ticker
   */
  const stopTicking = () => {
    if (tickInterval) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }  // Watch for changes in clock state (server updates)
  // Only sync when server timer values or turn actually change
  watch(
    () => clockState.value ? {
      whiteTimeMs: clockState.value.whiteTimeMs,
      blackTimeMs: clockState.value.blackTimeMs,
      currentTurn: clockState.value.currentTurn,
      lastMoveTimestamp: clockState.value.lastMoveTimestamp,
      isGameActive: clockState.value.isGameActive
    } : null,
    (newState, oldState) => {
      if (newState) {
        // Only sync if timer values or turn actually changed
        const shouldSync = !oldState || 
          oldState.whiteTimeMs !== newState.whiteTimeMs ||
          oldState.blackTimeMs !== newState.blackTimeMs ||
          oldState.currentTurn !== newState.currentTurn ||
          oldState.lastMoveTimestamp !== newState.lastMoveTimestamp
        
        if (shouldSync) {
          console.log('[Clock Watch] Timer state changed, syncing...', {
            oldWhite: oldState?.whiteTimeMs,
            newWhite: newState.whiteTimeMs,
            oldBlack: oldState?.blackTimeMs,
            newBlack: newState.blackTimeMs,
            currentTurn: newState.currentTurn
          })
          
          syncWithServer()
        }
        
        // Start/stop ticking based on game state
        if (newState.isGameActive) {
          startTicking()
        } else {
          stopTicking()
        }
      } else {
        stopTicking()
      }
    },
    { immediate: true }
  )

  // Lifecycle
  onMounted(() => {
    syncWithServer()
    if (clockState.value?.isGameActive) {
      startTicking()
    }
  })

  onUnmounted(() => {
    stopTicking()
  })

  // Computed display properties
  const whiteFormatted = computed(() => formatTime(whiteDisplayMs.value))
  const blackFormatted = computed(() => formatTime(blackDisplayMs.value))
  
  const whiteStatus = computed(() => getTimeStatus(whiteDisplayMs.value, baseTimeMs))
  const blackStatus = computed(() => getTimeStatus(blackDisplayMs.value, baseTimeMs))
  
  const isWhiteTicking = computed(() => 
    clockState.value?.isGameActive === true && clockState.value?.currentTurn === 'white'
  )
  
  const isBlackTicking = computed(() => 
    clockState.value?.isGameActive === true && clockState.value?.currentTurn === 'black'
  )

  return {
    whiteDisplayMs,
    blackDisplayMs,
    whiteFormatted,
    blackFormatted,
    whiteStatus,
    blackStatus,
    isWhiteTicking,
    isBlackTicking
  }
}

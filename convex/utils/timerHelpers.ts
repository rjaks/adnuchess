
/**
 * Pure helper functions for chess timer calculations
 * These functions are stateless and testable
 */

export type TimeControl = {
  baseTimeMs: number
  incrementMs: number
  type: 'none' | 'standard' | 'increment' | 'delay'
}

export type TimerState = {
  whiteTimeMs: number
  blackTimeMs: number
  lastMoveTimestamp: number
  gameStartTimestamp: number
}

export type TimerUpdateResult = {
  whiteTimeMs: number
  blackTimeMs: number
  lastMoveTimestamp: number
  timedOut: boolean
  timeoutWinner: 'white' | 'black' | null
}

/**
 * Calculate elapsed time since last move
 */
export function calculateElapsedTime(
  lastMoveTimestamp: number,
  nowMs: number
): number {
  return Math.max(0, nowMs - lastMoveTimestamp)
}

/**
 * Update timers when a move is made
 * 
 * @param timerState Current timer state
 * @param timeControl Time control settings
 * @param movingColor Color of the player making the move
 * @param nowMs Current timestamp in milliseconds
 * @returns Updated timer state with timeout detection
 */
export function updateTimersOnMove(
  timerState: TimerState,
  timeControl: TimeControl | null,
  movingColor: 'white' | 'black',
  nowMs: number
): TimerUpdateResult {
  // If no time control, return unchanged state
  if (!timeControl || timeControl.type === 'none') {
    return {
      whiteTimeMs: timerState.whiteTimeMs,
      blackTimeMs: timerState.blackTimeMs,
      lastMoveTimestamp: nowMs,
      timedOut: false,
      timeoutWinner: null
    }
  }

  // Special case: White's first move (clock hasn't started yet)
  // lastMoveTimestamp === 0 means the clock hasn't started
  if (timerState.lastMoveTimestamp === 0 && movingColor === 'white') {
    console.log('[Timer] White\'s first move - starting the clock')
    return {
      whiteTimeMs: timerState.whiteTimeMs,
      blackTimeMs: timerState.blackTimeMs,
      lastMoveTimestamp: nowMs, // Start the clock
      timedOut: false,
      timeoutWinner: null
    }
  }

  // Calculate elapsed time since last move
  const elapsed = calculateElapsedTime(timerState.lastMoveTimestamp, nowMs)

  // Get moving player's remaining time
  const movingPlayerTime = movingColor === 'white' 
    ? timerState.whiteTimeMs 
    : timerState.blackTimeMs

  // Check if player ran out of time BEFORE making the move
  const newRemainingTime = movingPlayerTime - elapsed
  
  if (newRemainingTime <= 0) {
    // TIMEOUT: Player ran out of time
    const timeoutWinner = movingColor === 'white' ? 'black' : 'white'
    
    return {
      whiteTimeMs: movingColor === 'white' ? 0 : timerState.whiteTimeMs,
      blackTimeMs: movingColor === 'black' ? 0 : timerState.blackTimeMs,
      lastMoveTimestamp: nowMs,
      timedOut: true,
      timeoutWinner
    }
  }

  // Player made move in time - deduct elapsed and apply increment
  let finalTime = newRemainingTime
  
  // Apply increment (if any) as a reward for making the move in time
  if (timeControl.type === 'increment' && timeControl.incrementMs > 0) {
    finalTime += timeControl.incrementMs
  }

  // Update the appropriate player's time
  const result: TimerUpdateResult = {
    whiteTimeMs: movingColor === 'white' ? finalTime : timerState.whiteTimeMs,
    blackTimeMs: movingColor === 'black' ? finalTime : timerState.blackTimeMs,
    lastMoveTimestamp: nowMs,
    timedOut: false,
    timeoutWinner: null
  }

  return result
}

/**
 * Check if a player's time has expired (for heartbeat/timeout detection)
 * 
 * @param timerState Current timer state
 * @param currentTurn Whose turn it is
 * @param nowMs Current timestamp
 * @returns Timeout winner or null if no timeout
 */
export function checkForTimeout(
  timerState: TimerState,
  currentTurn: 'white' | 'black',
  nowMs: number
): 'white' | 'black' | null {
  // Clock hasn't started yet (waiting for White's first move)
  if (timerState.lastMoveTimestamp === 0) {
    return null
  }

  const elapsed = calculateElapsedTime(timerState.lastMoveTimestamp, nowMs)
  const currentPlayerTime = currentTurn === 'white' 
    ? timerState.whiteTimeMs 
    : timerState.blackTimeMs

  const remainingTime = currentPlayerTime - elapsed

  if (remainingTime <= 0) {
    // Current player timed out, opponent wins
    return currentTurn === 'white' ? 'black' : 'white'
  }

  return null
}

/**
 * Initialize timer state for a new game
 * Timer doesn't start until White's first move
 */
export function initializeTimers(
  timeControl: TimeControl | null,
  nowMs: number
): TimerState {
  if (!timeControl || timeControl.type === 'none') {
    // No time control - set to a very large number
    return {
      whiteTimeMs: Number.MAX_SAFE_INTEGER,
      blackTimeMs: Number.MAX_SAFE_INTEGER,
      lastMoveTimestamp: nowMs,
      gameStartTimestamp: nowMs
    }
  }

  return {
    whiteTimeMs: timeControl.baseTimeMs,
    blackTimeMs: timeControl.baseTimeMs,
    lastMoveTimestamp: 0, // Clock not started yet - will be set on White's first move
    gameStartTimestamp: 0  // Will be set on White's first move
  }
}

/**
 * Parse time control string (e.g., "5+0", "10+5", "15+10")
 * Format: "baseMinutes+incrementSeconds"
 */
export function parseTimeControl(timeControlString: string): TimeControl {
  const parts = timeControlString.split('+')
  
  if (parts.length !== 2) {
    throw new Error('Invalid time control format. Expected "minutes+seconds" (e.g., "5+0", "10+5")')
  }

  const baseMinutes = parseInt(parts[0], 10)
  const incrementSeconds = parseInt(parts[1], 10)

  if (isNaN(baseMinutes) || isNaN(incrementSeconds)) {
    throw new Error('Invalid time control format. Base time and increment must be numbers')
  }

  if (baseMinutes < 0 || incrementSeconds < 0) {
    throw new Error('Time control values must be positive')
  }

  const baseTimeMs = baseMinutes * 60 * 1000
  const incrementMs = incrementSeconds * 1000

  return {
    baseTimeMs,
    incrementMs,
    type: incrementSeconds > 0 ? 'increment' : 'standard'
  }
}

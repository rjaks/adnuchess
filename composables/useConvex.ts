import { useNuxtApp } from '#app'
import { api } from '../convex/_generated/api'
import { ref, computed } from 'vue'

export function useConvex() {
  const { $convex } = useNuxtApp()
  const loading = ref(false)
  const error = ref<Error | null>(null)
    // Get game by ID
  async function getGame(gameId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await $convex.query(api.games.getGameById, { gameId })
      return result
    } catch (err: any) {
      console.error('Error fetching game:', err)
      error.value = err instanceof Error ? err : new Error(err?.message || String(err))
      return null
    } finally {
      loading.value = false
    }
  }
  // Make a move
  async function makeMove(gameId: string, move: string, playerId: string) {
    loading.value = true
    error.value = null
    try {
      // Try both approaches: string path and api object
      try {
        // First try with the direct path string
        console.log('Making move with string path:', { gameId, move, playerId })
        await $convex.mutation('games:makeMove', { gameId, move, playerId })
        return true
      } catch (pathError: any) {
        console.warn('Error with string path, trying API object:', pathError)
        // Fall back to api object if string path fails
        await $convex.mutation(api.games.makeMove, { gameId, move, playerId })
        return true
      }
    } catch (err: any) {
      console.error('Error making move:', err)
      error.value = err instanceof Error ? err : new Error(err?.message || String(err))
      return false
    } finally {
      loading.value = false
    }
  }
    // Subscribe to game updates
  function subscribeToGame(gameId: string, callback: (game: any) => void) {
    try {
      return $convex.onUpdate(
        api.games.getGameById,
        { gameId },
        callback
      )
    } catch (err: any) {
      console.error('Error setting up game subscription:', err)
      error.value = err instanceof Error ? err : new Error(err?.message || String(err))
      return () => {}; // Return empty unsubscribe function
    }
  }
  
  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    getGame,
    makeMove,
    subscribeToGame,
  }
}

import { useNuxtApp } from '#app'
import { api } from '../convex/_generated/api'
import { ref, computed } from 'vue'

export function useConvex() {
  const { $convex } = useNuxtApp()
  const loading = ref(false)
  const error = ref(null)
  
  // Get game by ID
  async function getGame(gameId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await $convex.query(api.games.getGameById, { gameId })
      return result
    } catch (err) {
      console.error('Error fetching game:', err)
      error.value = err
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
      await $convex.mutation(api.games.makeMove, { gameId, move, playerId })
      return true
    } catch (err) {
      console.error('Error making move:', err)
      error.value = err
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Subscribe to game updates
  function subscribeToGame(gameId: string, callback: (game: any) => void) {
    return $convex.onUpdate(
      api.games.getGameById,
      { gameId },
      callback
    )
  }
  
  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    getGame,
    makeMove,
    subscribeToGame,
  }
}

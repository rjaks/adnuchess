<template>
  <div class="space-y-8">
    <!-- Analysis Mode -->
    <template v-if="isAnalyzeMode">
      <header class="rounded-4xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Game Review</p>
            <h1 class="mt-3 text-3xl font-bold text-slate-900">Game Analysis</h1>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-600">Game ID: {{ matchId }}</p>
            <button
              @click="router.back()"
              class="mt-2 rounded-lg border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] hover:bg-white"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </header>

      <GameAnalysisViewer :game-id="matchId" />
    </template>

    <!-- Live Game Mode -->
    <template v-else>
      <!-- Real Game Notice -->
      <div class="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-inner">
        <h3 class="text-lg font-semibold text-green-900">Live Multiplayer Game</h3>
        <p class="mt-2 text-sm text-green-700">
          This is a real player vs player game using Convex database for move synchronization. Moves are synced instantly.
        </p>
      </div>

      <header class="rounded-4xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Live Multiplayer Chess</p>
            <h1 class="mt-3 text-3xl font-bold text-slate-900">Game Arena</h1>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-600">Game ID: {{ matchId }}</p>
            <button
              @click="confirmLeaveGame"
              class="mt-2 rounded-lg border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] hover:bg-white"
            >
              Back to Matchmaking
            </button>
          </div>
        </div>
      </header>

      <!-- Live Chess Game -->
      <PollingChessGame ref="gameRef" :game-id="matchId" />
      
      <!-- Leave Game Confirmation Modal -->
      <div v-if="showLeaveConfirmation" class="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
        <div class="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold text-slate-900">Leave Game?</h3>
          <p class="mt-2 text-slate-600">Leaving this game will count as a resignation. Are you sure?</p>
          <div class="mt-4 flex justify-end gap-3">
            <button
              @click="showLeaveConfirmation = false"
              class="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              @click="leaveGame"
              class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter, useNuxtApp } from '#imports'
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import PollingChessGame from '~/components/PollingChessGame.vue'
import GameAnalysisViewer from '~/components/GameAnalysisViewer.vue'

const route = useRoute()
const router = useRouter()
const matchId = route.params.id as string
const gameRef = ref<InstanceType<typeof PollingChessGame> | null>(null)
const showLeaveConfirmation = ref(false)
const { user } = useAuth()

// Check if we're in analyze mode (query param ?analyze=true)
const isAnalyzeMode = computed(() => route.query.analyze === 'true')

const confirmLeaveGame = () => {
  // Always show confirmation dialog when leaving a game
  showLeaveConfirmation.value = true;
}

const leaveGame = () => {
  showLeaveConfirmation.value = false;
  
  // Use the Convex API directly to resign
  const { $convex } = useNuxtApp();
  
  try {
    // Try to resign directly via Convex API
    if (user.value?.id) {
      $convex.mutation('chess_games_gameEnd:resignGame', {
        gameId: matchId,
        playerId: user.value.id
      }).catch(err => {
        console.error('Error when resigning:', err);
      });
    }
  } catch (error) {
    console.error('Failed to resign game:', error);
  }
  
  // Navigate back to matchmaking regardless
  setTimeout(() => {
    router.push('/matchmaking');
  }, 500);
}
</script>
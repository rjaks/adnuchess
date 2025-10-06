<template>
  <div class="space-y-8">
    <!-- Real Game Notice -->
    <div class="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-inner">
      <h3 class="text-lg font-semibold text-green-900">Live Multiplayer Game</h3>
      <p class="mt-2 text-sm text-green-700">
        This is a real player vs player game using HTTP polling for move synchronization. Moves are synced every 2 seconds.
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
            @click="$router.push('/matchmaking')"
            class="mt-2 rounded-lg border border-[#021d94]/30 bg-white/80 px-4 py-2 text-sm font-semibold text-[#021d94] hover:bg-white"
          >
            Back to Matchmaking
          </button>
        </div>
      </div>
    </header>

    <!-- Live Chess Game -->
    <PollingChessGame :game-id="matchId" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '#imports'
import PollingChessGame from '~/components/PollingChessGame.vue'

const route = useRoute()
const matchId = route.params.id as string
</script>
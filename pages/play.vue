<template>
  <div class="space-y-8">
    <header class="rounded-4xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">AdNU vs Stockfish</p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900">Glassy arena battle</h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-600">
        Click <strong>Start New Game</strong> or pick up a white piece to begin. Every completed match updates your AdNU Chess profile, tracking wins, losses, draws, and badge progress in real time.
      </p>
    </header>
    <ChessArena />
  </div>
</template>

<script setup lang="ts">
import ChessArena from '~/components/ChessArena.vue'
</script>


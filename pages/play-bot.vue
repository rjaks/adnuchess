<template>
  <div class="space-y-8">
    <header class="rounded-4xl border border-white/70 bg-white/70 p-8 shadow-glass backdrop-blur-xl">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Play vs AI Bot</p>
      <h1 class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Challenge Stockfish</h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-600">
        Play against our AI powered by the Lichess Cloud Stockfish engine. Choose your difficulty level 
        and test your chess skills. All games are saved to your profile for tracking your progress.
      </p>
    </header>
    <BotGameHandler />
  </div>
</template>

<script setup lang="ts">
import BotGameHandler from '~/components/BotGameHandler.vue'

// Page metadata
definePageMeta({
  title: 'Play vs Bot',
})
</script>

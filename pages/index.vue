<template>
  <section class="space-y-6">
    <div>
      <h2 class="text-3xl font-semibold">The Golden Knights’ Arena</h2>
      <p class="text-slate-600 mt-1">A campus-only chess hub for Ateneans.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MenuLink to="/play" title="Play AdNU Chess!" desc="Bot, fellow Atenean, or AI Coach" />
      <MenuLink to="/modes" title="Extra Modes" desc="PuzzleNida, Battle Royale, QuizMania" />
      <MenuLink to="/account" title="Account" desc="Profile, roles, preferences" />
      <MenuLink to="/leaderboard" title="Leaderboards" desc="Elo tiers and departments" />
      <MenuLink to="/faq" title="FAQs" desc="Rules & help center" />
      <MenuLink to="/settings" title="Settings" desc="Chat filter & more" />
    </div>
  </section>
</template>

<script setup lang="ts">
import MenuLink from '~/components/MenuLink.vue'  // explicit to be safe
</script>

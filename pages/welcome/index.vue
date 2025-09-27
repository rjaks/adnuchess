<template>
  <div class="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.1fr,0.9fr]">
    <section class="space-y-6">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-glass">
          <img src="/adnuchesslogo.png" alt="AdNU Chess logo" class="h-10 w-10 object-contain" />
        </span>
        <div class="leading-tight">
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">AdNU</p>
          <p class="text-lg font-bold text-[#021d94]">Chess Arena</p>
        </div>
      </div>
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Welcome Knights</p>
      <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Enter the AdNU Chess Arena</h1>
      <p class="text-base text-slate-600 sm:text-lg">
        Battle classmates, unlock campus-exclusive badges, and log every brilliant checkmate. Sign in with your official
        <span class="font-semibold">@gbox.adnu.edu.ph</span> email to create your glassy arena profile.
      </p>
      <ul class="space-y-3 text-sm text-slate-600">
        <li class="flex items-start gap-3">
          <span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#021d94]/15 text-xs font-semibold text-[#021d94]">1</span>
          Verify your university Google account.
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#021d94]/15 text-xs font-semibold text-[#021d94]">2</span>
          Claim your AdNU Chess profile with tracked stats, badges, and achievements.
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#021d94]/15 text-xs font-semibold text-[#021d94]">3</span>
          Queue into luminous matches against Stockfish or fellow Ateneans.
        </li>
      </ul>
    </section>
    <AuthSignInPanel redirect-to="/" title="Sign in to play" description="Your account powers stats, badges, and matchmaking." />
  </div>
</template>

<script setup lang="ts">
import AuthSignInPanel from '~/components/AuthSignInPanel.vue'
</script>


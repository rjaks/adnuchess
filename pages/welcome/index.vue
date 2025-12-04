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
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-panel-soft border border-white/70 bg-white/80 p-4 shadow-glass">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Quick start</p>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li class="flex items-start gap-2">
              <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#021d94]/15 text-[10px] font-semibold text-[#021d94]">1</span>
              Verify your @gbox.adnu.edu.ph account.
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#021d94]/15 text-[10px] font-semibold text-[#021d94]">2</span>
              Choose “Stay signed in” if this is your personal device.
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#021d94]/15 text-[10px] font-semibold text-[#021d94]">3</span>
              Jump into matchmaking or training mode.
            </li>
          </ul>
        </div>
        <div class="rounded-panel-soft border border-white/70 bg-white/80 p-4 shadow-glass">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Why sign in</p>
          <ul class="mt-3 space-y-2 text-sm text-slate-600">
            <li class="flex items-start gap-2">
              <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#021d94]/15 text-[10px] font-semibold text-[#021d94]">★</span>
              Track Elo, streaks, and badges unique to campus.
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#021d94]/15 text-[10px] font-semibold text-[#021d94]">⚡</span>
              Save puzzles and training progress.
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#021d94]/15 text-[10px] font-semibold text-[#021d94]">🤝</span>
              Join verified matches with fellow Ateneans.
            </li>
          </ul>
        </div>
      </div>
    </section>
    <AuthSignInPanel
      redirect-to="/"
      title="Sign in to play"
      description="Your account powers stats, badges, and matchmaking."
      :stay-signed-in="staySignedIn"
      @update:stay-signed-in="(val) => (staySignedIn = val)"
    />
  </div>
</template>

<script setup lang="ts">
import AuthSignInPanel from '~/components/AuthSignInPanel.vue'
import { ref, watch } from 'vue'

const staySignedIn = ref(true)

watch(
  staySignedIn,
  (val) => {
    if (process.client && val) {
      localStorage.setItem('adnu_stay_signed_in', '1')
    } else if (process.client) {
      localStorage.removeItem('adnu_stay_signed_in')
    }
  },
  { immediate: true },
)
</script>

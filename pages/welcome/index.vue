<template>
  <div
    class="relative isolate h-full overflow-hidden rounded-[28px] border border-white/50 bg-white/70 px-4 py-6 shadow-2xl shadow-[#021d94]/10 backdrop-blur-2xl md:px-10"
  >
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute -left-24 top-[-6rem] h-80 w-80 rounded-full bg-gradient-to-br from-[#b5cfff] via-white to-[#ffe2a8] opacity-70 blur-3xl"></div>
      <div class="absolute right-[-10%] top-12 h-72 w-72 rounded-full bg-gradient-to-br from-white via-[#ffe9c6] to-[#7fa4ff] opacity-70 blur-3xl"></div>
      <div class="absolute bottom-[-18%] left-1/3 h-64 w-64 rounded-full bg-gradient-to-br from-[#021d94]/30 via-white/60 to-white opacity-80 blur-3xl"></div>
    </div>

    <div class="mx-auto grid h-full max-w-6xl items-center gap-10 md:grid-cols-[1.05fr,0.95fr] lg:gap-16">
      <section class="space-y-7 md:space-y-9">
        <div class="flex flex-wrap items-center gap-3">
          <span class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-glass">
            <img src="/adnuchesslogo.png" alt="AdNU Chess logo" class="h-10 w-10 object-contain" />
          </span>
          <div class="leading-tight">
            <p class="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">AdNU</p>
            <p class="text-lg font-bold text-[#021d94]">Chess Arena</p>
          </div>
          <span class="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[12px] font-medium text-slate-600 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.2)]"></span>
            Verified campus access
          </span>
        </div>

        <div class="space-y-4">
          <p class="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Welcome, Knights</p>
          <h1 class="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
           Arena for Chess exclusively for Ateneo de Naga University
          </h1>
          <p class="text-base text-slate-600 sm:text-lg">
            Challenge classmates, earn campus-exclusive badges, and keep every checkmate on record. Sign in with your
            <span class="font-semibold">@gbox.adnu.edu.ph</span> email to enter.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-glass backdrop-blur">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#021d94]/70">Quick start</p>
            <div class="mt-3 space-y-2 text-sm text-slate-600">
              <div class="flex items-center gap-2 rounded-xl bg-[#021d94]/5 px-3 py-2">
                <span class="text-xs font-semibold text-[#021d94]">1</span>
                Verify your @gbox.adnu.edu.ph account.
              </div>
              <div class="flex items-center gap-2 rounded-xl bg-[#021d94]/5 px-3 py-2">
                <span class="text-xs font-semibold text-[#021d94]">2</span>
                Choose “Stay signed in” on personal devices.
              </div>
              <div class="flex items-center gap-2 rounded-xl bg-[#021d94]/5 px-3 py-2">
                <span class="text-xs font-semibold text-[#021d94]">3</span>
                Jump into matchmaking or solo training.
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-glass backdrop-blur">
            <p class="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#021d94]/70">Why sign in</p>
            <div class="mt-3 space-y-2 text-sm text-slate-600">
              <div class="flex items-center gap-2 rounded-xl px-3 py-2">
                <span class="text-lg">★</span>
                Track Elo, streaks, and campus-only badges.
              </div>
              <div class="flex items-center gap-2 rounded-xl px-3 py-2">
                <span class="text-lg">⚡</span>
                Save puzzles and training progress.
              </div>
              <div class="flex items-center gap-2 rounded-xl px-3 py-2">
                <span class="text-lg">🤝</span>
                Join verified matches with fellow Ateneans.
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthSignInPanel
        redirect-to="/"
        title="Sign in to play"
        description="Your account powers stats, badges, and matchmaking."
        :stay-signed-in="staySignedIn"
        class="self-center"
        @update:stay-signed-in="(val) => (staySignedIn = val)"
      />
    </div>
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

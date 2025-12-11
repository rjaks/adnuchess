<template>
  <section class="mx-auto flex min-h-[calc(100vh-9rem)] max-w-5xl items-center justify-center px-4 py-12">
    <div class="w-full rounded-3xl border border-white/70 bg-white/80 p-10 text-center shadow-glass backdrop-blur-xl">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-[#021d94]/70">Temporarily unavailable</p>
      <h1 class="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">PuzzleNida is currently offline</h1>
      <p class="mt-3 text-sm text-slate-600">
        We’re reworking this mode and will bring it back soon. Thanks for your patience.
      </p>
      <div class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <NuxtLink
          to="/modes"
          class="inline-flex items-center gap-2 rounded-full border border-[#021d94]/20 bg-white px-5 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/50 hover:bg-white"
        >
          View other modes
        </NuxtLink>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#021d94] to-[#ffaa00] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg hover:shadow-[#021d94]/25"
        >
          Return home
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

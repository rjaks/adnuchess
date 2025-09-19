<template>
  <section class="space-y-4">
    <h2 class="text-2xl font-semibold">Play AdNU Chess!</h2>
    <p class="text-slate-600">For now, choose a mode (we'll wire login & matchmaking next):</p>
    <div class="grid sm:grid-cols-3 gap-3">
      <button class="rounded-xl px-4 py-3 bg-adnu-blue text-white/90">Play vs Bot</button>
      <NuxtLink to="/matchmaking" class="rounded-xl px-4 py-3 bg-adnu-gold text-black/90 text-center">Play vs Atenean</NuxtLink>
      <button class="rounded-xl px-4 py-3 border">AI Coach (coming)</button>
    </div>
  </section>
</template>

<template>
  <NuxtLink
    :to="to"
    class="block rounded-3xl bg-white/70 backdrop-blur border border-white/60 p-6 shadow-glass hover:shadow-lg transition"
  >
    <h3 class="text-lg font-semibold">{{ title }}</h3>
    <p class="text-slate-600 mt-1">{{ desc }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ to: string; title: string; desc: string }>()
</script>

<template>
  <div class="max-w-4xl mx-auto p-8 space-y-6">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Game Management</h1>
      <p class="text-slate-600 mt-2">Manage and cleanup expired chess games</p>
    </header>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- Cleanup Controls -->
      <div class="rounded-lg border border-white/70 bg-white/70 p-6">
        <h2 class="text-xl font-semibold mb-4">Game Cleanup</h2>
        <p class="text-sm text-slate-600 mb-4">
          Games older than 30 minutes are automatically marked as expired and won't appear in matchmaking.
        </p>
        
        <button
          @click="runCleanup"
          :disabled="isLoading"
          class="w-full px-4 py-2 bg-[#021d94] text-white rounded-lg hover:bg-[#021d94]/90 disabled:opacity-50"
        >
          {{ isLoading ? 'Cleaning up...' : 'Run Manual Cleanup' }}
        </button>
        
        <div v-if="cleanupResult" class="mt-4 p-3 rounded bg-green-100 text-green-800 text-sm">
          {{ cleanupResult }}
        </div>
      </div>

      <!-- Game Statistics -->
      <div class="rounded-lg border border-white/70 bg-white/70 p-6">
        <h2 class="text-xl font-semibold mb-4">Game Statistics</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Total Games:</span>
            <span class="font-medium">{{ stats.total }}</span>
          </div>
          <div class="flex justify-between">
            <span>Active Games:</span>
            <span class="font-medium text-green-600">{{ stats.active }}</span>
          </div>
          <div class="flex justify-between">
            <span>Finished Games:</span>
            <span class="font-medium text-slate-600">{{ stats.finished }}</span>
          </div>
          <div class="flex justify-between">
            <span>Expired Games:</span>
            <span class="font-medium text-red-600">{{ stats.expired }}</span>
          </div>
        </div>
        
        <button
          @click="refreshStats"
          class="w-full mt-4 px-4 py-2 border border-[#021d94] text-[#021d94] rounded-lg hover:bg-[#021d94]/10"
        >
          Refresh Stats
        </button>
      </div>
    </div>

    <div class="text-center">
      <NuxtLink 
        to="/matchmaking" 
        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#021d94] to-[#ffaa00] text-white rounded-lg hover:shadow-lg transition"
      >
        Back to Matchmaking
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isLoading = ref(false)
const cleanupResult = ref('')
const stats = ref({
  total: 0,
  active: 0,
  finished: 0,
  expired: 0
})

const runCleanup = async () => {
  isLoading.value = true
  cleanupResult.value = ''
  
  try {
    const response = await $fetch('/api/games/cleanup', {
      method: 'POST'
    })
    
    if (response.success) {
      cleanupResult.value = response.message
      await refreshStats()
    }
  } catch (error) {
    console.error('Cleanup failed:', error)
    cleanupResult.value = 'Cleanup failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const refreshStats = async () => {
  try {
    const response = await $fetch('/api/games/stats') as any
    stats.value = response.stats
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

onMounted(() => {
  refreshStats()
})

definePageMeta({
  title: 'Game Management'
})
</script>
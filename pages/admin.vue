<template>
  <div class="max-w-6xl mx-auto p-8 space-y-6">
    <header>
      <h1 class="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      <p class="text-slate-600 mt-2">Manage chess games and puzzle content</p>
    </header>

    <!-- Check if user is authorized for admin functions -->
    <div v-if="!isAdmin" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <h2 class="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
      <p class="text-red-600 mb-4">
        You don't have permission to access administrative functions.
      </p>
      <p class="text-red-600 text-sm mb-6">
        Only authorized ADNU personnel can access the admin panel.
      </p>
      <NuxtLink 
        to="/" 
        class="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
      >
        Return to Game
      </NuxtLink>
    </div>

    <!-- Admin Content (only visible to authorized users) -->
    <div v-else>
      <!-- Game Management Section -->
      <section class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-800">Game Management</h2>
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Cleanup Controls -->
          <div class="rounded-lg border border-white/70 bg-white/70 p-6">
            <h3 class="text-xl font-semibold mb-4">Game Cleanup</h3>
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
            <h3 class="text-xl font-semibold mb-4">Game Statistics</h3>
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
      </section>

      <!-- PuzzleNida Management Section -->
      <section class="space-y-4">
        <h2 class="text-2xl font-bold text-slate-800">PuzzleNida Management</h2>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Puzzle Management -->
          <NuxtLink 
            to="/admin/puzzles"
            class="rounded-lg border border-white/70 bg-white/70 p-6 hover:bg-white/80 transition-colors group"
          >
            <div class="flex items-center space-x-4 mb-4">
              <div class="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Puzzle Management</h3>
                <p class="text-sm text-slate-600">Create & Edit Puzzles</p>
              </div>
            </div>
            <p class="text-slate-600 text-sm">
              Create, edit, and manage chess puzzles for the PuzzleNida system.
            </p>
          </NuxtLink>

          <!-- Puzzle Statistics -->
          <div class="rounded-lg border border-white/70 bg-white/70 p-6">
            <div class="flex items-center space-x-4 mb-4">
              <div class="bg-blue-100 p-3 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-800">Puzzle Stats</h3>
                <p class="text-sm text-slate-600">Overview</p>
              </div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Total Puzzles:</span>
                <span class="font-medium">{{ puzzleStats.totalPuzzles }}</span>
              </div>
              <div class="flex justify-between">
                <span>Active Puzzles:</span>
                <span class="font-medium text-green-600">{{ puzzleStats.activePuzzles }}</span>
              </div>
              <div class="flex justify-between">
                <span>Submissions:</span>
                <span class="font-medium text-blue-600">{{ puzzleStats.totalSubmissions }}</span>
              </div>
              <div class="flex justify-between">
                <span>Success Rate:</span>
                <span class="font-medium text-purple-600">{{ puzzleStats.successRate }}%</span>
              </div>
            </div>
            <button
              @click="refreshPuzzleStats"
              class="w-full mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Refresh
            </button>
          </div>

          <!-- Quick Actions -->
          <div class="rounded-lg border border-white/70 bg-white/70 p-6">
            <div class="flex items-center space-x-4 mb-4">
              <div class="bg-green-100 p-3 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-800">Quick Actions</h3>
                <p class="text-sm text-slate-600">Common Tasks</p>
              </div>
            </div>
            <div class="space-y-2">
              <NuxtLink 
                to="/admin/puzzles"
                class="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center text-sm"
              >
                Create New Puzzle
              </NuxtLink>
              <NuxtLink 
                to="/puzzlenida"
                class="block w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition text-center text-sm"
              >
                View Player Interface
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="text-center" v-if="isAdmin">
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
import { ref, computed, onMounted } from 'vue'
import { useConvex } from '~/composables/useConvex'
import { useAuth } from '~/composables/useAuth'

// Composables
const { api } = useConvex()
const { user } = useAuth()

const isLoading = ref(false)
const cleanupResult = ref('')
const stats = ref({
  total: 0,
  active: 0,
  finished: 0,
  expired: 0
})

const puzzleStats = ref({
  totalPuzzles: 0,
  activePuzzles: 0,
  totalSubmissions: 0,
  successRate: 0
})

// Admin authorization check
const isAdmin = computed(() => {
  // Authorized ADNU personnel emails
  const adminEmails = [
    'lojenar@gbox.adnu.edu.ph', // Your email
    // Add other authorized ADNU admin emails here as needed
    // 'admin@gbox.adnu.edu.ph',
    // 'it.admin@gbox.adnu.edu.ph',
    // 'faculty.admin@gbox.adnu.edu.ph'
  ]
  return user.value && adminEmails.includes(user.value.email)
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

const refreshPuzzleStats = async () => {
  try {
    if (isAdmin.value) {
      const response = await api.query('puzzle_admin', 'getPuzzleStats')
      puzzleStats.value = response
    }
  } catch (error) {
    console.error('Failed to fetch puzzle stats:', error)
  }
}

onMounted(() => {
  if (isAdmin.value) {
    refreshStats()
    refreshPuzzleStats()
  }
})

definePageMeta({
  title: 'Admin Dashboard',
  middleware: 'admin'
})
</script>
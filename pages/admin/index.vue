<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="bg-gray-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-white">AdNU Chess Admin</h1>
            <p class="text-gray-300 mt-1">Administrative Dashboard</p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-300">Admin: {{ user?.name }}</span>
            <NuxtLink 
              to="/" 
              class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors"
            >
              Back to Game
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Access Denied for Non-Admins -->
      <div v-if="!isAdmin" class="text-center py-20">
        <div class="bg-red-900/50 border border-red-700 rounded-lg p-8 max-w-md mx-auto">
          <h2 class="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p class="text-red-300 mb-4">
            You don't have permission to access the admin panel.
          </p>
          <p class="text-red-300 mb-6 text-sm">
            Only authorized ADNU personnel can access administrative functions.
          </p>
          <NuxtLink 
            to="/" 
            class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Return to Game
          </NuxtLink>
        </div>
      </div>

      <!-- Admin Panel -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- PuzzleNida Management -->
        <NuxtLink 
          to="/admin/puzzles"
          class="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition-colors group"
        >
          <div class="flex items-center space-x-4 mb-4">
            <div class="bg-purple-600 p-3 rounded-lg group-hover:bg-purple-500 transition-colors">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">PuzzleNida</h3>
              <p class="text-gray-300">Manage chess puzzles</p>
            </div>
          </div>
          <p class="text-gray-400 text-sm">
            Create, edit, and manage chess puzzles for the PuzzleNida system. Track user submissions and puzzle performance.
          </p>
        </NuxtLink>

        <!-- Game Management -->
        <div class="bg-gray-800 rounded-lg p-6 opacity-50">
          <div class="flex items-center space-x-4 mb-4">
            <div class="bg-blue-600 p-3 rounded-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Game Management</h3>
              <p class="text-gray-300">Coming Soon</p>
            </div>
          </div>
          <p class="text-gray-400 text-sm">
            Monitor active games, manage tournaments, and handle game-related administrative tasks.
          </p>
        </div>

        <!-- User Management -->
        <div class="bg-gray-800 rounded-lg p-6 opacity-50">
          <div class="flex items-center space-x-4 mb-4">
            <div class="bg-green-600 p-3 rounded-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">User Management</h3>
              <p class="text-gray-300">Coming Soon</p>
            </div>
          </div>
          <p class="text-gray-400 text-sm">
            Manage user accounts, roles, and permissions. View user statistics and handle administrative user tasks.
          </p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold text-white mb-6">Quick Stats</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Total Users</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.totalUsers }}</p>
          </div>
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Active Games</h3>
            <p class="text-3xl font-bold text-green-400">{{ stats.activeGames }}</p>
          </div>
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Total Puzzles</h3>
            <p class="text-3xl font-bold text-purple-400">{{ stats.totalPuzzles }}</p>
          </div>
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Puzzle Submissions</h3>
            <p class="text-3xl font-bold text-yellow-400">{{ stats.puzzleSubmissions }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConvex } from '~/composables/useConvex'
import { useAuth } from '~/composables/useAuth'

// Page metadata
definePageMeta({
  layout: false
})

// Composables
const { api } = useConvex()
const { user } = useAuth()

// Reactive data
const stats = ref({
  totalUsers: 0,
  activeGames: 0,
  totalPuzzles: 0,
  puzzleSubmissions: 0
})

// Computed
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

// Methods
const loadStats = async () => {
  try {
    if (isAdmin.value) {
      // Load basic stats - these would need to be implemented in Convex
      const puzzleStats = await api.query('puzzle_admin', 'getPuzzleStats')
      stats.value = {
        totalUsers: 0, // Would need a separate query
        activeGames: 0, // Would need a separate query
        totalPuzzles: puzzleStats.totalPuzzles,
        puzzleSubmissions: puzzleStats.totalSubmissions
      }
    }
  } catch (error) {
    console.error('Error loading admin stats:', error)
  }
}

// Lifecycle
onMounted(() => {
  if (isAdmin.value) {
    loadStats()
  }
})
</script>
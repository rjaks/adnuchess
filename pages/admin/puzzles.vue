<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Admin Header -->
    <div class="bg-gray-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-white">PuzzleNida Admin</h1>
            <p class="text-gray-300 mt-1">Chess Puzzle Management System</p>
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
            You don't have permission to access the PuzzleNida admin panel.
          </p>
          <p class="text-red-300 mb-6 text-sm">
            Only authorized ADNU personnel can create and manage chess puzzles.
          </p>
          <div class="bg-gray-700 text-gray-200 px-6 py-2 rounded-lg mr-4 inline-flex items-center justify-center">
            PuzzleNida is offline
          </div>
          <NuxtLink 
            to="/" 
            class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Return to Game
          </NuxtLink>
        </div>
      </div>

      <!-- Admin Panel -->
      <div v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Total Puzzles</h3>
            <p class="text-3xl font-bold text-blue-400">{{ stats.totalPuzzles }}</p>
          </div>
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Active Puzzles</h3>
            <p class="text-3xl font-bold text-green-400">{{ stats.activePuzzles }}</p>
          </div>
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Total Submissions</h3>
            <p class="text-3xl font-bold text-yellow-400">{{ stats.totalSubmissions }}</p>
          </div>
          <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="text-lg font-semibold text-gray-300">Success Rate</h3>
            <p class="text-3xl font-bold text-purple-400">{{ stats.successRate }}%</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-4 mb-8">
          <button
            @click="showCreatePuzzle = true"
            class="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white font-semibold transition-colors"
          >
            + Create New Puzzle
          </button>
          <button
            @click="refreshPuzzles"
            class="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            @click="exportPuzzles"
            class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg text-white font-semibold transition-colors"
          >
            📥 Export Data
          </button>
        </div>

        <!-- Puzzles Table -->
        <div class="bg-gray-800 rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700">
            <h2 class="text-xl font-semibold text-white">Puzzle Management</h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Theme
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-gray-800 divide-y divide-gray-700">
                <tr v-for="puzzle in puzzles" :key="puzzle._id" class="hover:bg-gray-700">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-white">{{ puzzle.title }}</div>
                    <div class="text-sm text-gray-400" v-if="puzzle.description">{{ puzzle.description }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getDifficultyColor(puzzle.difficulty)" class="px-2 py-1 text-xs font-semibold rounded-full">
                      {{ puzzle.difficulty }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {{ puzzle.theme || 'General' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">
                    {{ puzzle.points }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="puzzle.isActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'" 
                          class="px-2 py-1 text-xs font-semibold rounded-full">
                      {{ puzzle.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {{ puzzle.submissionCount || 0 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      @click="editPuzzle(puzzle)"
                      class="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      @click="togglePuzzleStatus(puzzle)"
                      :class="puzzle.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'"
                    >
                      {{ puzzle.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button
                      @click="deletePuzzle(puzzle)"
                      class="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="!puzzles.length" class="text-center py-12">
            <p class="text-gray-400">No puzzles found. Create your first puzzle to get started!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Puzzle Modal -->
    <PuzzleEditor
      v-if="showCreatePuzzle || editingPuzzle"
      :puzzle="editingPuzzle"
      @close="closeEditor"
      @save="savePuzzle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConvex } from '~/composables/useConvex'
import { useAuth } from '~/composables/useAuth'
import { isAdminEmail } from '~/config/admin'

// Page metadata
definePageMeta({
  layout: false
})

// Composables
const { api } = useConvex()
const { user } = useAuth()

// Reactive data
const puzzles = ref<any[]>([])
const stats = ref({
  totalPuzzles: 0,
  activePuzzles: 0,
  totalSubmissions: 0,
  successRate: 0
})
const showCreatePuzzle = ref(false)
const editingPuzzle = ref<any>(null)
const loading = ref(true)

// Computed
const isAdmin = computed(() => {
  return user.value && isAdminEmail(user.value.email)
})

// Methods
const refreshPuzzles = async () => {
  try {
    loading.value = true
    const [puzzleData, statsData] = await Promise.all([
      api.query('puzzle_admin', 'getAllPuzzles'),
      api.query('puzzle_admin', 'getPuzzleStats')
    ])
    puzzles.value = puzzleData
    stats.value = statsData
  } catch (error) {
    console.error('Error fetching puzzles:', error)
  } finally {
    loading.value = false
  }
}

const getDifficultyColor = (difficulty: string) => {
  const colors: { [key: string]: string } = {
    beginner: 'bg-green-900 text-green-300',
    intermediate: 'bg-yellow-900 text-yellow-300',
    advanced: 'bg-orange-900 text-orange-300',
    expert: 'bg-red-900 text-red-300'
  }
  return colors[difficulty] || 'bg-gray-900 text-gray-300'
}

const editPuzzle = (puzzle: any) => {
  editingPuzzle.value = puzzle
}

const closeEditor = () => {
  showCreatePuzzle.value = false
  editingPuzzle.value = null
}

const savePuzzle = async (puzzleData: any) => {
  try {
    if (editingPuzzle.value) {
      await api.mutation('puzzle_admin', 'updatePuzzle', {
        puzzleId: editingPuzzle.value._id,
        ...puzzleData
      })
    } else {
      await api.mutation('puzzle_admin', 'createPuzzle', puzzleData)
    }
    closeEditor()
    await refreshPuzzles()
  } catch (error) {
    console.error('Error saving puzzle:', error)
    alert('Error saving puzzle. Please try again.')
  }
}

const togglePuzzleStatus = async (puzzle: any) => {
  try {
    await api.mutation('puzzle_admin', 'updatePuzzle', {
      puzzleId: puzzle._id,
      isActive: !puzzle.isActive
    })
    await refreshPuzzles()
  } catch (error) {
    console.error('Error toggling puzzle status:', error)
  }
}

const deletePuzzle = async (puzzle: any) => {
  if (!confirm(`Are you sure you want to delete "${puzzle.title}"?`)) return
  
  try {
    await api.mutation('puzzle_admin', 'deletePuzzle', { puzzleId: puzzle._id })
    await refreshPuzzles()
  } catch (error) {
    console.error('Error deleting puzzle:', error)
  }
}

const exportPuzzles = () => {
  // Export puzzles and submissions data as JSON
  const dataStr = JSON.stringify({ puzzles: puzzles.value, stats: stats.value }, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `puzzlenda-data-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
  if (isAdmin.value) {
    await refreshPuzzles()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-800 mb-2">QuizMania Admin</h1>
        <p class="text-slate-600">Manage quiz questions and view statistics</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid gap-6 md:grid-cols-2 mb-8">
        <div class="bg-white/80 rounded-2xl p-6 border border-white/60">
          <h3 class="text-lg font-bold text-slate-800 mb-4">Database Setup</h3>
          <button 
            @click="seedQuestions" 
            :disabled="seeding"
            class="w-full px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {{ seeding ? 'Adding Questions...' : 'Seed Quiz Questions' }}
          </button>
          <p class="text-sm text-slate-600 mt-2">Add initial set of quiz questions to the database</p>
        </div>

        <div class="bg-white/80 rounded-2xl p-6 border border-white/60">
          <h3 class="text-lg font-bold text-slate-800 mb-4">Statistics</h3>
          <button 
            @click="loadStats" 
            :disabled="loadingStats"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {{ loadingStats ? 'Loading...' : 'Refresh Stats' }}
          </button>
          <p class="text-sm text-slate-600 mt-2">View current quiz system statistics</p>
        </div>
      </div>

      <!-- Statistics Display -->
      <div v-if="stats" class="bg-white/80 rounded-2xl p-6 border border-white/60 mb-8">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Quiz System Stats</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ stats.totalQuestions }}</div>
            <div class="text-sm text-slate-600">Total Questions</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ stats.activeQuestions }}</div>
            <div class="text-sm text-slate-600">Active Questions</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ stats.totalSessions }}</div>
            <div class="text-sm text-slate-600">Total Sessions</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-indigo-600">{{ stats.completedSessions }}</div>
            <div class="text-sm text-slate-600">Completed</div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-semibold text-slate-800 mb-2">Questions by Category</h4>
            <div class="space-y-2">
              <div v-for="(count, category) in stats.categoryCounts" :key="category" 
                   class="flex justify-between text-sm">
                <span class="capitalize">{{ category.replace('-', ' ') }}</span>
                <span class="font-semibold">{{ count }}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-semibold text-slate-800 mb-2">Questions by Difficulty</h4>
            <div class="space-y-2">
              <div v-for="(count, difficulty) in stats.difficultyCounts" :key="difficulty" 
                   class="flex justify-between text-sm">
                <span class="capitalize">{{ difficulty }}</span>
                <span class="font-semibold">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="message" class="mb-6">
        <div class="p-4 rounded-xl" 
             :class="message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'">
          {{ message.text }}
        </div>
      </div>

      <!-- Back to QuizMania -->
      <div class="text-center">
        <button @click="$router.push('/quizmania')" 
                class="px-6 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors">
          Back to QuizMania
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { $convex } = useNuxtApp()

const seeding = ref(false)
const loadingStats = ref(false)
const stats = ref(null)
const message = ref(null)

const seedQuestions = async () => {
  seeding.value = true
  message.value = null
  
  try {
    const result = await $convex.mutation("quiz_admin:seedQuizQuestions", {})
    message.value = {
      type: 'success',
      text: result.message
    }
    
    // Refresh stats after seeding
    await loadStats()
    
  } catch (error) {
    console.error('Failed to seed questions:', error)
    message.value = {
      type: 'error',
      text: 'Failed to seed questions. Please try again.'
    }
  } finally {
    seeding.value = false
  }
}

const loadStats = async () => {
  loadingStats.value = true
  
  try {
    stats.value = await $convex.mutation("quiz_admin:getQuizStats", {})
  } catch (error) {
    console.error('Failed to load stats:', error)
    message.value = {
      type: 'error',
      text: 'Failed to load statistics.'
    }
  } finally {
    loadingStats.value = false
  }
}

// Load stats on mount
onMounted(() => {
  loadStats()
})

definePageMeta({
  title: 'QuizMania Admin'
})
</script>

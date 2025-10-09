<template>
  <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
    <div class="bg-gray-800 rounded-lg p-8 max-w-md w-full">
      <h1 class="text-2xl font-bold mb-6 text-center">Admin Setup</h1>
      <p class="text-gray-300 mb-6 text-center">
        One-time setup to grant admin privileges to your account.
      </p>

      <div v-if="!user" class="text-center">
        <p class="text-red-400 mb-4">Please log in first</p>
        <NuxtLink to="/welcome" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors">
          Go to Login
        </NuxtLink>
      </div>

      <div v-else-if="setupComplete" class="text-center">
        <div class="bg-green-900/50 border border-green-700 rounded-lg p-4 mb-4">
          <h3 class="text-green-400 font-bold mb-2">✅ Setup Complete!</h3>
          <p class="text-green-300">You now have admin privileges.</p>
        </div>
        <NuxtLink to="/admin" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors">
          Go to Admin Panel
        </NuxtLink>
      </div>

      <div v-else>
        <div class="mb-4">
          <p class="text-sm text-gray-300 mb-2"><strong>Current User:</strong></p>
          <p class="bg-gray-700 p-3 rounded text-sm font-mono">{{ user.email }}</p>
        </div>

          <button
            @click="setupAdmin"
            :disabled="settingUp"
            class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-semibold transition-colors"
          >
            {{ settingUp ? 'Setting Up...' : 'Grant Admin Privileges' }}
          </button>        <p class="text-xs text-gray-400 mt-4 text-center">
          This will grant admin privileges to the currently logged-in account.
        </p>
      </div>

      <div class="mt-6 text-center">
        <NuxtLink to="/" class="text-blue-400 hover:text-blue-300 text-sm">
          Back to Game
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
const settingUp = ref(false)
const setupComplete = ref(false)

// Methods
const setupAdmin = async () => {
  if (!user.value?.email) return
  
  try {
    settingUp.value = true
    
    await api.mutation('admin', 'setAdminStatus', {
      email: user.value.email,
      isAdmin: true
    })
    
    setupComplete.value = true
  } catch (error) {
    console.error('Error setting up admin:', error)
    alert('Error setting up admin privileges. Make sure you have a profile created first.')
  } finally {
    settingUp.value = false
  }
}
</script>
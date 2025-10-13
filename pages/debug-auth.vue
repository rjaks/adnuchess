<template>
  <div class="mx-auto max-w-4xl p-8">
    <h1 class="text-3xl font-bold mb-8">🔍 Auth Debug Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Client-side Auth State -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Client Auth State</h2>
        <div class="space-y-2 text-sm">
          <div><strong>Authenticated:</strong> {{ auth.user.value ? '✅ Yes' : '❌ No' }}</div>
          <div><strong>Initialized:</strong> {{ auth.isInitialized.value ? '✅ Yes' : '❌ No' }}</div>
          <div v-if="auth.user.value">
            <strong>User ID:</strong> {{ auth.user.value.id }}
          </div>
          <div v-if="auth.user.value">
            <strong>Email:</strong> {{ auth.user.value.email }}
          </div>
          <div v-if="auth.user.value">
            <strong>Name:</strong> {{ auth.user.value.name }}
          </div>
        </div>
      </div>

      <!-- Server Auth State -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Server Auth State</h2>
        <button 
          @click="checkServerAuth" 
          :disabled="loading"
          class="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ loading ? 'Checking...' : 'Check Server Auth' }}
        </button>
        
        <div v-if="serverAuth" class="space-y-2 text-sm">
          <div><strong>Authenticated:</strong> {{ serverAuth.authenticated ? '✅ Yes' : '❌ No' }}</div>
          <div><strong>Has Session:</strong> {{ serverAuth.debug?.hasSession ? '✅ Yes' : '❌ No' }}</div>
          <div><strong>Convex Available:</strong> {{ serverAuth.convexAvailable ? '✅ Yes' : '❌ No' }}</div>
          
          <div v-if="serverAuth.session">
            <strong>User ID:</strong> {{ serverAuth.session.userId }}
          </div>
          <div v-if="serverAuth.session">
            <strong>Email:</strong> {{ serverAuth.session.email }}
          </div>
          <div v-if="serverAuth.session">
            <strong>Has Profile:</strong> {{ serverAuth.session.hasProfile ? '✅ Yes' : '❌ No' }}
          </div>
          <div v-if="serverAuth.session">
            <strong>Profile Role:</strong> {{ serverAuth.session.profileRole || 'None' }}
          </div>
          <div v-if="serverAuth.session">
            <strong>Profile Complete:</strong> {{ serverAuth.session.profileComplete ? '✅ Yes' : '❌ No' }}
          </div>
          
          <div v-if="serverAuth.error" class="text-red-600">
            <strong>Error:</strong> {{ serverAuth.error }}
          </div>
          <div v-if="serverAuth.convexError" class="text-red-600">
            <strong>Convex Error:</strong> {{ serverAuth.convexError }}
          </div>
        </div>
      </div>

      <!-- Convex Profile State -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Convex Profile</h2>
        <button 
          @click="checkConvexProfile" 
          :disabled="loadingProfile || !auth.user.value"
          class="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {{ loadingProfile ? 'Loading...' : 'Check Convex Profile' }}
        </button>
        
        <div v-if="convexProfile" class="space-y-2 text-sm">
          <div><strong>Profile Exists:</strong> {{ convexProfile ? '✅ Yes' : '❌ No' }}</div>
          <div v-if="convexProfile">
            <strong>Role:</strong> {{ convexProfile.role || 'Not set' }}
          </div>
          <div v-if="convexProfile">
            <strong>Display Name:</strong> {{ convexProfile.displayName || 'None' }}
          </div>
          <div v-if="convexProfile">
            <strong>Department:</strong> {{ convexProfile.department || 'None' }}
          </div>
          <div v-if="convexProfile">
            <strong>ELO:</strong> {{ convexProfile.elo }}
          </div>
        </div>
        
        <div v-if="convexError" class="text-red-600">
          <strong>Error:</strong> {{ convexError }}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
        <div class="space-y-2">
          <button 
            @click="refreshAuth"
            class="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Refresh Auth
          </button>
          <button 
            @click="clearSession"
            class="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear Session
          </button>
          <NuxtLink 
            to="/profile-setup"
            class="block w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center"
          >
            Go to Profile Setup
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Raw Data -->
    <div class="mt-8 bg-gray-100 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Raw Debug Data</h2>
      <pre class="text-xs overflow-auto">{{ JSON.stringify({ 
        clientAuth: {
          user: auth.user.value,
          isInitialized: auth.isInitialized.value
        },
        serverAuth,
        convexProfile,
        convexError
      }, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'

const auth = useAuth()
const { $convex } = useNuxtApp()

const loading = ref(false)
const loadingProfile = ref(false)
const serverAuth = ref<any>(null)
const convexProfile = ref<any>(null)
const convexError = ref<string | null>(null)

const checkServerAuth = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/auth/debug')
    serverAuth.value = response
  } catch (error) {
    serverAuth.value = { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  } finally {
    loading.value = false
  }
}

const checkConvexProfile = async () => {
  if (!auth.user.value) return
  
  loadingProfile.value = true
  convexError.value = null
  
  try {
    const profile = await $convex.query(api.profiles.getByUserId, {
      userId: auth.user.value.id
    })
    convexProfile.value = profile
  } catch (error) {
    convexError.value = error instanceof Error ? error.message : 'Unknown error'
    convexProfile.value = null
  } finally {
    loadingProfile.value = false
  }
}

const refreshAuth = async () => {
  try {
    await auth.refresh()
    // Also refresh server auth
    await checkServerAuth()
  } catch (error) {
    console.error('Refresh failed:', error)
  }
}

const clearSession = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await auth.refresh()
    serverAuth.value = null
    convexProfile.value = null
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Auto-check on mount
onMounted(() => {
  checkServerAuth()
  if (auth.user.value) {
    checkConvexProfile()
  }
})
</script>

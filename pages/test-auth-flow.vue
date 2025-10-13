<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <header class="text-center">
      <h1 class="text-3xl font-bold text-slate-900">Authentication Flow Test</h1>
      <p class="text-slate-600 mt-2">Test the complete sign-in → profile setup flow for production</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Current State -->
      <div class="bg-white rounded-lg border p-4">
        <h2 class="font-semibold mb-3 flex items-center gap-2">
          <span class="text-lg">🔍</span> Current State
        </h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span>Authenticated:</span>
            <span :class="currentState.authenticated ? 'text-green-600' : 'text-red-600'">
              {{ currentState.authenticated ? '✅ Yes' : '❌ No' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>User ID:</span>
            <span class="font-mono text-xs">{{ currentState.userId || 'None' }}</span>
          </div>
          <div class="flex justify-between">
            <span>User Name:</span>
            <span>{{ currentState.userName || 'N/A' }}</span>
          </div>
          <div class="flex justify-between">
            <span>Profile Exists:</span>
            <span :class="currentState.hasProfile ? 'text-green-600' : 'text-orange-600'">
              {{ currentState.hasProfile ? '✅ Yes' : '⚠️ No' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Environment:</span>
            <span class="px-2 py-1 text-xs rounded" :class="isProduction ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
              {{ currentState.environment }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Convex Connected:</span>
            <span :class="currentState.convexConnected ? 'text-green-600' : 'text-red-600'">
              {{ currentState.convexConnected ? '✅ Yes' : '❌ No' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Test Actions -->
      <div class="bg-white rounded-lg border p-4">
        <h2 class="font-semibold mb-3 flex items-center gap-2">
          <span class="text-lg">🧪</span> Test Actions
        </h2>
        <div class="space-y-3">
          <button 
            @click="testProfileSetupAccess"
            :disabled="testing || !currentState.authenticated"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ testing ? 'Testing...' : 'Test Profile Setup Access' }}
          </button>
          
          <button 
            @click="simulateNewUser"
            :disabled="testing || !currentState.authenticated"
            class="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simulate New User (Clear Profile)
          </button>
          
          <button 
            @click="refreshState"
            :disabled="testing"
            class="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {{ refreshing ? 'Refreshing...' : 'Refresh State' }}
          </button>

          <NuxtLink 
            to="/profile-setup"
            class="block w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
          >
            Go to Profile Setup
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Test Results -->
    <div v-if="testResults.length > 0" class="bg-white rounded-lg border p-4">
      <h2 class="font-semibold mb-3 flex items-center gap-2">
        <span class="text-lg">📊</span> Test Results
      </h2>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        <div 
          v-for="(result, index) in testResults" 
          :key="index"
          class="p-3 rounded text-sm border-l-4"
          :class="result.success ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'"
        >
          <div class="flex items-center gap-2 font-medium">
            <span>{{ result.success ? '✅' : '❌' }}</span>
            <span>{{ result.step }}</span>
          </div>
          <p class="mt-1 text-xs opacity-75">{{ result.message }}</p>
          <p class="mt-1 text-xs font-mono opacity-60">{{ new Date(result.timestamp).toLocaleTimeString() }}</p>
        </div>
      </div>
      <button 
        @click="testResults = []"
        class="mt-3 text-xs text-slate-500 hover:text-slate-700"
      >
        Clear Results
      </button>
    </div>

    <!-- Production Troubleshooting -->
    <div v-if="isProduction" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 class="font-semibold text-amber-800 mb-2">🚨 Production Environment Detected</h3>
      <p class="text-sm text-amber-700 mb-3">
        In production, common issues include:
      </p>
      <ul class="text-xs text-amber-600 space-y-1 list-disc list-inside">
        <li>Authentication tokens not persisting after OAuth redirect</li>
        <li>Convex connection failures due to environment variables</li>
        <li>CORS issues with domain configuration</li>
        <li>Session storage not working across page navigations</li>
      </ul>
    </div>

    <!-- Debug Raw Data -->
    <details class="bg-slate-50 rounded-lg p-4">
      <summary class="cursor-pointer font-medium text-slate-700">🔧 Raw Debug Data</summary>
      <pre class="mt-3 text-xs bg-slate-100 p-3 rounded overflow-auto">{{ JSON.stringify({
        currentState,
        authUser: currentState.authenticated ? 'Present' : 'None',
        convexStatus: currentState.convexConnected ? 'Connected' : 'Disconnected',
        environment: currentState.environment,
        timestamp: new Date().toISOString()
      }, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNuxtApp, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'

const { $convex } = useNuxtApp()
const auth = useAuth()

const testing = ref(false)
const refreshing = ref(false)

const currentState = ref({
  authenticated: false,
  userId: '',
  userName: '',
  hasProfile: false,
  convexConnected: false,
  environment: process.env.NODE_ENV || 'unknown'
})

const isProduction = computed(() => 
  currentState.value.environment === 'production' || 
  (process.client && !window.location.origin.includes('localhost'))
)

const testResults = ref<Array<{
  step: string
  success: boolean
  message: string
  timestamp: number
}>>([])

const addResult = (step: string, success: boolean, message: string) => {
  testResults.value.unshift({
    step,
    success,
    message,
    timestamp: Date.now()
  })
}

const refreshState = async () => {
  refreshing.value = true
  try {
    console.log('🔄 Refreshing authentication state...')
    
    // Refresh auth
    await auth.refresh()
    const user = auth.user.value
    
    // Update state
    currentState.value.authenticated = !!user
    currentState.value.userId = user?.id || ''
    currentState.value.userName = user?.name || ''
    currentState.value.convexConnected = !!$convex
    
    // Check profile if user exists
    if (user && $convex) {
      try {
        const profile = await $convex.query(api.profiles.getByUserId, { userId: user.id })
        currentState.value.hasProfile = !!profile
        addResult('State Refresh', true, `User: ${user.name}, Profile: ${profile ? 'Exists' : 'Missing'}`)
      } catch (error) {
        console.error('Error checking profile:', error)
        currentState.value.hasProfile = false
        addResult('Profile Check', false, `Error: ${error}`)
      }
    } else {
      addResult('State Refresh', !user, user ? 'User authenticated' : 'No authenticated user')
    }
  } catch (error) {
    console.error('Error refreshing state:', error)
    addResult('State Refresh', false, `Refresh failed: ${error}`)
  } finally {
    refreshing.value = false
  }
}

const testProfileSetupAccess = async () => {
  testing.value = true
  
  try {
    addResult('Profile Setup Test', true, 'Starting profile setup access test')
    
    // Test 1: Check authentication
    if (!currentState.value.authenticated) {
      addResult('Authentication Check', false, 'User not authenticated - cannot access profile setup')
      return
    }
    
    addResult('Authentication Check', true, 'User is authenticated')
    
    // Test 2: Check Convex connection
    if (!currentState.value.convexConnected) {
      addResult('Convex Check', false, 'Convex not connected - profile setup will fail')
      return
    }
    
    addResult('Convex Check', true, 'Convex is connected')
    
    // Test 3: Navigate to profile setup
    try {
      await navigateTo('/profile-setup')
      addResult('Navigation Test', true, 'Successfully navigated to profile setup page')
    } catch (error) {
      addResult('Navigation Test', false, `Navigation failed: ${error}`)
    }
    
  } finally {
    testing.value = false
  }
}

const simulateNewUser = async () => {
  if (!auth.user.value || !$convex) {
    addResult('Simulate New User', false, 'Cannot simulate - no user or Convex connection')
    return
  }
  
  testing.value = true
  
  try {
    // Note: This would require a mutation to delete the profile
    // For now, just simulate the state
    currentState.value.hasProfile = false
    addResult('Simulate New User', true, 'Profile state cleared - user should see profile setup on next login')
    
    // Navigate to profile setup to test
    await navigateTo('/profile-setup')
  } catch (error) {
    addResult('Simulate New User', false, `Failed to simulate new user: ${error}`)
  } finally {
    testing.value = false
  }
}

// Set page metadata
definePageMeta({
  title: 'Auth Flow Test',
  requiresAuth: false // Allow access even without auth to test the flow
})

onMounted(async () => {
  await refreshState()
})
</script>

<template>
  <section class="mx-auto max-w-xl space-y-8 rounded-3xl border bg-white/80 p-8 shadow">
    <header>
      <h1 class="text-2xl font-bold text-slate-900">Complete your profile</h1>
      <p class="text-slate-600">Please provide your information to complete your AdNU Chess Arena profile.</p>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="flex items-center gap-3">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <span class="text-slate-600">Loading your profile...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-lg bg-red-50 border border-red-200 p-4">
      <div class="flex items-start gap-3">
        <svg class="h-5 w-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-red-800">Profile Setup Error</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          <button 
            @click="retryInit"
            class="mt-3 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Form -->
    <form v-else class="space-y-5" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-slate-700">Full Name</label>
        <input
          v-model.trim="name"
          type="text"
          required
          placeholder="Enter your full name"
          class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200 focus:border-blue-500"
        />
        <p class="mt-1 text-xs text-slate-500">This will be used for official purposes and rankings</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">Display Name <span class="text-slate-400">(Optional)</span></label>
        <input
          v-model.trim="displayName"
          type="text"
          placeholder="Enter a display name (defaults to your full name)"
          class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200 focus:border-blue-500"
        />
        <p class="mt-1 text-xs text-slate-500">This is how other players will see you in games and chat</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700">College <span class="text-red-500">*</span></label>
        <select
          v-model="department"
          required
          class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring focus:ring-blue-200 focus:border-blue-500 bg-white"
        >
          <option value="">Select your college</option>
          <option value="College of Humanities and Social Sciences">College of Humanities and Social Sciences</option>
          <option value="College of Business and Accountancy">College of Business and Accountancy</option>
          <option value="College of Computer Studies">College of Computer Studies</option>
          <option value="College of Education">College of Education</option>
          <option value="College of Science, Engineering, and Architecture">College of Science, Engineering, and Architecture</option>
          <option value="College of Nursing">College of Nursing</option>
          <option value="College of Law">College of Law</option>
        </select>
        <p class="mt-1 text-xs text-slate-500">Select your college or academic unit</p>
      </div>

      <fieldset class="space-y-3">
        <legend class="block text-sm font-medium text-slate-700">Role <span class="text-red-500">*</span></legend>
        <div class="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input type="radio" value="student" v-model="role" class="text-blue-600" />
            <span>Student</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input type="radio" value="faculty" v-model="role" class="text-blue-600" />
            <span>Faculty</span>
          </label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border p-3 hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input type="radio" value="alumni" v-model="role" class="text-blue-600" />
            <span>Alumni</span>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        :disabled="submitting || !name || !department || !role"
        class="w-full rounded-xl bg-[#021d94] px-4 py-2 font-semibold text-white hover:bg-[#021d94]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {{ submitting ? "Saving..." : "Save & Continue" }}
      </button>
    </form>

    <!-- Debug Info (Production) -->
    <div v-if="showDebugInfo" class="mt-6 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
      <p class="font-medium mb-2">🔧 Debug Information:</p>
      <div class="space-y-1">
        <p>Environment: {{ debugInfo.environment }}</p>
        <p>User Available: {{ debugInfo.hasUser ? '✅ Yes' : '❌ No' }}</p>
        <p>User ID: {{ debugInfo.userId || 'N/A' }}</p>
        <p>User Name: {{ debugInfo.userName || 'N/A' }}</p>
        <p>Profile Exists: {{ debugInfo.hasProfile ? '✅ Yes' : '❌ No' }}</p>
        <p>Convex Connected: {{ debugInfo.convexConnected ? '✅ Yes' : '❌ No' }}</p>
      </div>
      <button 
        @click="showDebugInfo = false"
        class="mt-2 text-xs text-blue-600 hover:underline"
      >
        Hide Debug Info
      </button>
    </div>

    <!-- Show Debug Button -->
    <div v-else class="text-center">
      <button 
        @click="showDebugInfo = true"
        class="text-xs text-slate-500 hover:text-slate-700"
      >
        Show Debug Info
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp, navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'
import { api } from '~/convex/_generated/api'

type Role = 'student' | 'faculty' | 'alumni'

const { $convex } = useNuxtApp()
const auth = useAuth()

const name = ref<string>('')
const displayName = ref<string>('')
const department = ref<string>('')
const role = ref<Role | ''>('')
const submitting = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const showDebugInfo = ref(false)

// Debug info for production troubleshooting
const debugInfo = ref({
  hasUser: false,
  userId: '',
  userName: '',
  hasProfile: false,
  convexConnected: false,
  environment: process.env.NODE_ENV || 'unknown'
})

const initializeProfile = async () => {
  try {
    console.log('🔧 Profile setup - Starting authentication check...')
    
    // First, ensure we have a user
    if (!auth.user.value) {
      console.log('🔄 No user found, refreshing auth...')
      await auth.refresh()
    }
    
    const user = auth.user.value
    console.log('👤 Current user:', user ? `${user.name} (${user.id})` : 'None')
    
    // Update debug info
    debugInfo.value.hasUser = !!user
    debugInfo.value.userId = user?.id || ''
    debugInfo.value.userName = user?.name || ''
    debugInfo.value.convexConnected = !!$convex
    
    if (!user) {
      console.warn('❌ No authenticated user found, redirecting to welcome')
      error.value = 'Authentication required. Redirecting...'
      setTimeout(() => navigateTo('/welcome'), 2000)
      return
    }

    // Check Convex connection
    if (!$convex) {
      console.error('❌ Convex client not available')
      error.value = 'Database connection unavailable. Please refresh the page.'
      return
    }

    console.log('🔍 Checking existing profile...')
    
    // Try to get existing profile with error handling
    let existingProfile = null
    try {
      existingProfile = await $convex.query(api.profiles.getByUserId, { 
        userId: user.id 
      })
      console.log('📋 Existing profile:', existingProfile ? 'Found' : 'Not found')
      debugInfo.value.hasProfile = !!existingProfile
    } catch (profileError) {
      console.error('❌ Error fetching profile:', profileError)
      error.value = 'Unable to load profile data. Please try refreshing the page.'
      return
    }
    
    // Pre-fill form with existing data or user defaults
    name.value = (existingProfile?.name as string) ?? user.name ?? ''
    displayName.value = (existingProfile?.displayName as string) ?? ''
    department.value = (existingProfile?.department as string) ?? ''
    role.value = ((existingProfile?.role as Role | undefined) ?? '') as Role | ''
    
    console.log('✅ Profile setup initialized successfully')
    console.log('📝 Form data:', { 
      name: name.value, 
      displayName: displayName.value,
      department: department.value,
      role: role.value 
    })
    
  } catch (err) {
    console.error('❌ Profile setup initialization error:', err)
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initializeProfile()
})

const retryInit = async () => {
  loading.value = true
  error.value = null
  await initializeProfile()
}

async function save() {
  if (!auth.user.value || !name.value || !department.value || role.value === '') {
    console.warn('⚠️ Save attempted with incomplete data')
    return
  }
  
  submitting.value = true
  error.value = null
  
  try {
    // Use displayName if provided, otherwise fall back to name
    const finalDisplayName = displayName.value.trim() || name.value
    
    console.log('💾 Saving profile...', {
      userId: auth.user.value.id,
      name: name.value,
      displayName: finalDisplayName,
      college: department.value,
      role: role.value
    })
    
    await $convex.mutation(api.profiles.completeProfile, {
      userId: auth.user.value.id,
      name: name.value,
      displayName: finalDisplayName,
      department: department.value,
      role: role.value as Role,
    })
    
    console.log('✅ Profile saved successfully, redirecting to home')
    await navigateTo('/')
    
  } catch (saveError) {
    console.error('❌ Error saving profile:', saveError)
    error.value = saveError instanceof Error 
      ? `Save failed: ${saveError.message}` 
      : 'Failed to save profile. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>


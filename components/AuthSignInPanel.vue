<template>
  <section class="mx-auto max-w-3xl space-y-8 rounded-4xl border border-white/70 bg-white/70 p-10 shadow-glass backdrop-blur-xl">
    <header class="space-y-3 text-center md:text-left">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">AdNU Secure Login</p>
      <h1 class="text-3xl font-bold text-slate-900">{{ title }}</h1>
      <p class="text-sm text-slate-600">
        {{ description }}
        <span class="font-semibold">@gbox.adnu.edu.ph</span> accounts only.
      </p>
    </header>

    <div class="space-y-6">
      <!-- Google Sign-in Button (hidden during cooldown) -->
      <div v-if="!cooldownActive" ref="buttonEl" class="flex items-center justify-center min-h-[44px]"></div>
      
      <!-- Cooldown Warning -->
      <div v-if="cooldownActive" class="p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-amber-800">
              Authentication Temporarily Unavailable
            </h3>
            <p class="mt-1 text-sm text-amber-700">
              Google has temporarily blocked sign-in attempts due to multiple dismissals. 
              Please wait {{ Math.ceil(cooldownTimeRemaining / 60) }} minute{{ Math.ceil(cooldownTimeRemaining / 60) !== 1 ? 's' : '' }} before trying again.
            </p>
            <p class="mt-2 text-xs text-amber-600">
              💡 Tip: Don't dismiss the Google sign-in popup to avoid this cooldown.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Registration Error Warning -->
      <div v-if="registrationError && isNewUser" class="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-orange-800">
              New Account Registration Issue
            </h3>
            <p class="mt-1 text-sm text-orange-700">
              {{ registrationError }}
            </p>
            <p class="mt-2 text-xs text-orange-600">
              🆕 This appears to be your first time signing in. The system encountered an issue creating your account.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Retry buttons -->
      <div v-if="showRetryButton && !cooldownActive" class="flex flex-col items-center space-y-3">
        <button 
          @click="retryAuth"
          :disabled="isRetrying"
          class="px-6 py-2 bg-[#021d94] text-white rounded-lg hover:bg-[#021d94]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isRetrying ? 'Retrying...' : isNewUser ? 'Retry Account Creation' : 'Retry Sign-In' }}
        </button>
        
        <div class="flex gap-2">
          <button 
            @click="clearCacheAndRetry"
            :disabled="isRetrying"
            class="px-4 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear Cache & Reset
          </button>
          
          <button 
            @click="refreshPage"
            :disabled="isRetrying"
            class="px-4 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>

      <p v-if="status.message" :class="statusClass" class="text-center text-sm font-medium">
        {{ status.message }}
      </p>

      <!-- Enhanced Debug info for troubleshooting -->
      <div v-if="showDebugInfo" class="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
        <p><strong>Debug Info:</strong></p>
        <p>Domain: {{ currentDomain }}</p>
        <p>Environment: {{ isProduction ? 'Production' : 'Development' }}</p>
        <p>Client ID: {{ clientId ? 'Present' : 'Missing' }}</p>
        <p>Retry Count: {{ retryCount }}/{{ maxRetries }}</p>
        <p>Registration Attempts: {{ registrationAttempts }}/{{ maxRegistrationAttempts }}</p>
        <p>New User: {{ isNewUser ? 'Yes' : 'No' }}</p>
        <p>Registration Error: {{ registrationError ? 'Yes' : 'No' }}</p>
        <p>Dismissal Count: {{ dismissalCount }}/3</p>
        <p>Cooldown Active: {{ cooldownActive ? 'Yes' : 'No' }}</p>
        <p v-if="cooldownActive">Time Remaining: {{ cooldownTimeRemaining }}s</p>
      </div>
    </div>

    <div class="space-y-2 text-center text-xs text-slate-500">
      <p>Having trouble? Make sure you are logged into Google with your campus email before returning here.</p>
      <p><strong>Important:</strong> Don't dismiss the Google sign-in popup to avoid temporary blocks.</p>
      <p v-if="isNewUser" class="text-orange-600"><strong>New User:</strong> If registration keeps failing, please contact support.</p>
      <button 
        @click="showDebugInfo = !showDebugInfo"
        class="text-[#021d94] hover:underline"
      >
        {{ showDebugInfo ? 'Hide' : 'Show' }} Debug Info
      </button>
    </div>

    <div class="flex items-center justify-center gap-2 text-sm text-slate-600">
      <label class="inline-flex items-center gap-2">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-slate-300 text-[#021d94] focus:ring-[#021d94]"
          :checked="staySignedIn"
          @change="toggleStaySignedIn(($event.target as HTMLInputElement).checked)"
        />
        <span>Stay signed in on this device</span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo, useRuntimeConfig } from '#imports'
import { useAuth } from '~/composables/useAuth'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void
          prompt: (callback?: ((notification: any) => void) | undefined) => void
          renderButton: (element: HTMLElement, config: any) => void
          disableAutoSelect: () => void
          storeCredential: (credential: any) => void
          cancel: () => void
        }
      }
    }
  }
}

type GoogleIdentityCredential = {
  credential: string
}

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: GoogleIdentityCredential) => void
        hosted_domain?: string
        ux_mode?: 'popup' | 'redirect'
      }) => void
      renderButton: (
        parent: HTMLElement,
        options?: Record<string, unknown>
      ) => void
      prompt: () => void
    }
  }
}

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    redirectTo?: string
    staySignedIn?: boolean
  }>(),
  {
    title: 'Sign in with your gbox account',
    description: 'Use your university-issued Google credentials to access the glassy arena.',
    redirectTo: '/',
    staySignedIn: true,
  },
)

const emit = defineEmits<{
  (e: 'update:stay-signed-in', value: boolean): void
}>()

const config = useRuntimeConfig()
const clientId = config.public.googleClientId
const { user, loginWithCredential } = useAuth()
const buttonEl = ref<HTMLDivElement | null>(null)

const status = ref<{ message: string | null; type: 'info' | 'error' | 'success' | 'warning' }>({
  message: clientId ? 'Loading secure Google sign-in...' : 'Google client ID is missing in configuration.',
  type: clientId ? 'info' : 'error',
})

// Retry and debug functionality
const showRetryButton = ref(false)
const isRetrying = ref(false)
const showDebugInfo = ref(false)
const retryCount = ref(0)
const maxRetries = ref(3)

// Cooldown handling for Google OAuth dismissals
const cooldownActive = ref(false)
const cooldownTimeRemaining = ref(0)
const dismissalCount = ref(0)
const lastDismissalTime = ref(0)

// Enhanced error tracking for new user registration
const registrationError = ref<string | null>(null)
const isNewUser = ref(false)
const registrationAttempts = ref(0)
const maxRegistrationAttempts = 3

// Environment and domain info
const currentDomain = ref('')
const isProduction = ref(false)

// Initialize environment info
if (process.client) {
  currentDomain.value = window.location.origin
  isProduction.value = !currentDomain.value.includes('localhost')
}

const statusClass = computed(() => {
  switch (status.value.type) {
    case 'error':
      return 'text-[#b00020]'
    case 'success':
      return 'text-[#056839]'
    case 'warning':
      return 'text-amber-600'
    default:
      return 'text-[#021d94]'
  }
})

// Handle Google OAuth cooldown errors
const handleCooldownError = () => {
  cooldownActive.value = true
  
  // Google's exponential cooldown: 2, 4, 8, 16 minutes
  const cooldownDuration = Math.min(Math.pow(2, dismissalCount.value) * 60000, 16 * 60000)
  cooldownTimeRemaining.value = Math.ceil(cooldownDuration / 1000)
  
  status.value = {
    message: `Google authentication is temporarily blocked due to multiple dismissals. Please wait ${Math.ceil(cooldownTimeRemaining.value / 60)} minutes before trying again.`,
    type: 'warning'
  }
  
  // Countdown timer
  const countdownInterval = setInterval(() => {
    cooldownTimeRemaining.value--
    
    if (cooldownTimeRemaining.value <= 0) {
      clearInterval(countdownInterval)
      cooldownActive.value = false
      dismissalCount.value = 0
      status.value = {
        message: 'You can now try signing in again.',
        type: 'info'
      }
    } else {
      const minutes = Math.ceil(cooldownTimeRemaining.value / 60)
      status.value = {
        message: `Google authentication cooldown active. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        type: 'warning'
      }
    }
  }, 1000)
}

// Handle new user registration errors
const handleRegistrationError = (error: any) => {
  registrationAttempts.value++
  isNewUser.value = true
  
  console.error('🆕 New user registration failed:', error)
  
  const errorMsg = error?.data?.statusMessage || error?.message || 'Registration failed'
  
  if (errorMsg.includes('profile') || errorMsg.includes('database') || errorMsg.includes('convex')) {
    registrationError.value = 'Failed to create your profile in the database. This may be a temporary issue.'
  } else if (errorMsg.includes('email') || errorMsg.includes('domain')) {
    registrationError.value = 'Please ensure you are using your @gbox.adnu.edu.ph email address.'
  } else if (errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
    registrationError.value = 'Account creation is temporarily restricted. Please try again later.'
  } else {
    registrationError.value = 'Unable to complete registration. Please try again.'
  }
  
  status.value = {
    message: registrationError.value,
    type: 'error'
  }
  
  showRetryButton.value = true
  showDebugInfo.value = true
}

const ensureScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-identity-script')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.id = 'google-identity-script'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script.'))
    document.head.appendChild(script)
  })
}

const handleGoogleCredential = async ({ credential }: GoogleIdentityCredential) => {
  if (!credential) {
    status.value = { message: 'No credential received from Google.', type: 'error' }
    showRetryButton.value = true
    return
  }

  try {
    status.value = { message: 'Verifying your campus account...', type: 'info' }
    console.log('🔐 Processing Google credential...')
    
    const response = await loginWithCredential(credential)
    
    console.log('📥 Login response received:', {
      hasUser: !!response.user,
      userId: response.user?.id,
      userEmail: response.user?.email,
      isNew: response.isNew,
      responseKeys: Object.keys(response)
    })
    
    // Handle successful authentication
    if (response.isNew === true) {
      console.log('🆕 New user detected, redirecting to profile setup')
      console.log('🔍 Response details:', response)
      isNewUser.value = true
      status.value = {
        message: 'Welcome to AdNU Chess Arena! Setting up your profile...',
        type: 'success',
      }
      
      // Add delay to show success message, then navigate
      setTimeout(async () => {
        console.log('🚀 Starting navigation to profile setup...')
        console.log('📍 Current route:', useRoute().path)
        console.log('🔧 Current user after login:', useAuth().user.value)
        
        try {
          // Try multiple navigation methods to ensure it works
          console.log('🎯 Method 1: navigateTo with replace')
          await navigateTo('/profile-setup', { replace: true })
          console.log('✅ Navigation completed successfully')
        } catch (navError) {
          console.error('❌ navigateTo failed, trying router push:', navError)
          try {
            await useRouter().push('/profile-setup')
            console.log('✅ Router push completed successfully')
          } catch (routerError) {
            console.error('❌ Router push also failed, using window.location:', routerError)
            window.location.href = '/profile-setup'
          }
        }
      }, 1500)
    } else {
      console.log('👤 Existing user, redirecting to main app')
      status.value = {
        message: 'Signed in successfully! Redirecting...',
        type: 'success',
      }
      
      setTimeout(async () => {
        console.log('🚀 Navigating to:', props.redirectTo)
        await navigateTo(props.redirectTo)
      }, 1000)
    }
    
    showRetryButton.value = false
    registrationError.value = null
    // honor stay signed in
    if (props.staySignedIn && process.client) {
      localStorage.setItem('adnu_stay_signed_in', '1')
    } else if (process.client) {
      localStorage.removeItem('adnu_stay_signed_in')
    }
    
  } catch (error: any) {
    console.error('🚨 Authentication/Registration failed:', error)
    
    // Check if this is a new user registration error
    if (error?.status === 400 || error?.statusCode === 400 || 
        error?.message?.includes('profile') || error?.message?.includes('registration')) {
      handleRegistrationError(error)
      return
    }
    
    // Handle other authentication errors
    showRetryButton.value = true
    
    const errorMsg = error?.data?.statusMessage || error?.message || 'Sign-in failed'
    
    if (errorMsg.includes('token') || errorMsg.includes('aborted') || errorMsg.includes('origin')) {
      status.value = {
        message: 'Authentication temporarily unavailable. Please try again in a moment.',
        type: 'error',
      }
    } else if (errorMsg.includes('email') || errorMsg.includes('domain')) {
      status.value = {
        message: 'Please use your @gbox.adnu.edu.ph email address to sign in.',
        type: 'error',
      }
    } else {
      status.value = {
        message: 'Sign-in failed. Please try again or contact support if the issue persists.',
        type: 'error',
      }
    }
    
    // Show debug info for production errors
    if (isProduction.value) {
      showDebugInfo.value = true
    }
  }
}

// Retry authentication
const retryAuth = async () => {
  if (cooldownActive.value) {
    status.value = {
      message: `Please wait ${Math.ceil(cooldownTimeRemaining.value / 60)} more minutes before retrying.`,
      type: 'warning'
    }
    return
  }
  
  if (isRetrying.value) return
  
  isRetrying.value = true
  
  try {
    // Reset registration state
    registrationError.value = null
    
    // If we had registration issues, show specific messaging
    if (isNewUser.value) {
      status.value = { 
        message: 'Retrying account creation...', 
        type: 'info' 
      }
    } else {
      status.value = { 
        message: `Retrying authentication... (${retryCount.value + 1}/${maxRetries.value})`, 
        type: 'info' 
      }
    }
    
    retryCount.value++
    await initGoogle()
    
  } catch (error) {
    console.error('🔄 Retry failed:', error)
    
    if (retryCount.value >= maxRetries.value) {
      status.value = { 
        message: 'Multiple retry attempts failed. Please refresh the page or try again later.', 
        type: 'error' 
      }
      showRetryButton.value = false
    } else {
      status.value = {
        message: 'Retry failed. Please try again.',
        type: 'error'
      }
    }
  } finally {
    isRetrying.value = false
  }
}

// Clear cache and retry
const clearCacheAndRetry = async () => {
  if (isRetrying.value) return
  
  isRetrying.value = true
  
  try {
    console.log('🧹 Clearing authentication cache and resetting state...')
    
    // Clear Google account selection cache
    if (window.google?.accounts?.id) {
      window.google.accounts.id.cancel()
    }
    
    // Reset all state
    cooldownActive.value = false
    cooldownTimeRemaining.value = 0
    dismissalCount.value = 0
    retryCount.value = 0
    registrationAttempts.value = 0
    registrationError.value = null
    isNewUser.value = false
    
    // Clear browser storage
    if (process.client) {
      // Clear localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('google') || key.includes('oauth') || key.includes('gsi') || 
                   key.includes('auth') || key.includes('user'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear sessionStorage
      const sessionKeysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('google') || key.includes('oauth') || key.includes('gsi') || 
                   key.includes('auth') || key.includes('user'))) {
          sessionKeysToRemove.push(key)
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
    }
    
    status.value = { 
      message: 'Cache cleared and authentication state reset. Reinitializing...', 
      type: 'info' 
    }
    
    // Wait for cache to clear
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Force reload Google script
    const existingScript = document.getElementById('google-identity-script')
    if (existingScript) {
      existingScript.remove()
    }
    
    await initGoogle()
    
  } catch (error) {
    console.error('🧹 Clear cache failed:', error)
    status.value = { 
      message: 'Failed to clear cache. Please refresh the page manually and try again.', 
      type: 'error' 
    }
  } finally {
    isRetrying.value = false
  }
}

// Add method to manually refresh the page (nuclear option)
const refreshPage = () => {
  if (process.client) {
    window.location.reload()
  }
}

const initGoogle = async () => {
  if (!clientId) {
    status.value = {
      message: 'Missing Google client ID. Update GOOGLE_CLIENT_ID env and restart.',
      type: 'error',
    }
    showRetryButton.value = true
    return
  }

  // Check if we're in cooldown period
  if (cooldownActive.value) {
    return
  }

  try {
    console.log('🔐 Initializing Google Sign-In...')
    await ensureScript()
    
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services not available')
    }
    
    const googleIdentity = window.google as unknown as GoogleIdentity
    
    // Enhanced initialization with production error handling
    googleIdentity.accounts.id.initialize({
      client_id: clientId,
      hosted_domain: 'gbox.adnu.edu.ph',
      callback: handleGoogleCredential,
      ux_mode: 'popup', // Force popup mode for better error handling
    })
    
    if (buttonEl.value) {
      // Clear any existing button content
      buttonEl.value.innerHTML = ''
      
      googleIdentity.accounts.id.renderButton(buttonEl.value, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: 250,
      })
    }
    
    if (!status.value.message?.startsWith('Welcome') && !cooldownActive.value) {
      status.value = { message: 'Awaiting Google authentication...', type: 'info' }
    }
    
    console.log('✅ Google Sign-In initialized successfully')
  } catch (error: any) {
    console.error('🚨 Google Sign-In initialization failed:', error)
    
    const errorMsg = error?.message || 'Unknown error'
    
    // Check if error indicates cooldown
    if (errorMsg.includes('cool down') || errorMsg.includes('declined') || errorMsg.includes('dismissed')) {
      console.warn('🚫 Cooldown error detected:', errorMsg)
      handleCooldownError()
      return
    }
    
    if (errorMsg.includes('origin') || errorMsg.includes('token') || errorMsg.includes('aborted')) {
      status.value = { 
        message: 'Authentication service temporarily unavailable. This may be due to domain configuration.', 
        type: 'error' 
      }
      showRetryButton.value = true
      showDebugInfo.value = isProduction.value
    } else {
      status.value = { 
        message: 'Unable to load Google sign-in at the moment. Please try again.', 
        type: 'error' 
      }
      showRetryButton.value = true
    }
  }
}

const toggleStaySignedIn = (value: boolean) => {
  emit('update:stay-signed-in', value)
}

onMounted(async () => {
  if (user.value) {
    await navigateTo(props.redirectTo)
    return
  }
  await initGoogle()
})
</script>

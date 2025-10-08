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
      <div ref="buttonEl" class="flex items-center justify-center"></div>
      <p v-if="status.message" :class="statusClass" class="text-center text-sm font-medium">
        {{ status.message }}
      </p>
    </div>

    <p class="text-center text-xs text-slate-500">
      Having trouble? Make sure you are logged into Google with your campus email before returning here.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo, useRuntimeConfig } from '#imports'
import { useAuth } from '~/composables/useAuth'

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
  }>(),
  {
    title: 'Sign in with your gbox account',
    description: 'Use your university-issued Google credentials to access the glassy arena.',
    redirectTo: '/',
  },
)

const config = useRuntimeConfig()
const clientId = config.public.googleClientId
const { user, loginWithCredential } = useAuth()
const buttonEl = ref<HTMLDivElement | null>(null)

const status = ref<{ message: string | null; type: 'info' | 'error' | 'success' }>({
  message: clientId 
    ? 'Loading secure Google sign-in...' 
    : 'Google Client ID is missing. Please check your environment configuration.',
  type: clientId ? 'info' : 'error',
})

const statusClass = computed(() => {
  switch (status.value.type) {
    case 'error':
      return 'text-[#b00020]'
    case 'success':
      return 'text-[#056839]'
    default:
      return 'text-[#021d94]'
  }
})

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
    script.onload = () => {
      console.log('Google Identity script loaded successfully')
      resolve()
    }
    script.onerror = () => {
      console.error('Failed to load Google Identity script')
      reject(new Error('Failed to load Google Identity script.'))
    }
    document.head.appendChild(script)
  })
}

const handleGoogleCredential = async ({ credential }: GoogleIdentityCredential) => {
  if (!credential) {
    status.value = { message: 'No credential received from Google.', type: 'error' }
    return
  }

  try {
    status.value = { message: 'Verifying your campus account...', type: 'info' }
    const response = await loginWithCredential(credential)
    const destination = response.isNew ? '/account' : props.redirectTo
    status.value = {
      message: response.isNew
        ? 'Welcome to AdNU Chess Arena! Account created successfully.'
        : 'Signed in successfully! Redirecting...',
      type: 'success',
    }
    
    // Add a small delay to ensure the auth state is properly set
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Force a page reload to ensure proper auth state initialization
    if (process.client) {
      window.location.href = destination
    } else {
      await navigateTo(destination)
    }
  } catch (error: any) {
    console.error('Google login failed', error)
    status.value = {
      message: error?.data?.statusMessage || 'Sign-in failed. Make sure you are using your gbox email.',
      type: 'error',
    }
  }
}

const initGoogle = async () => {
  console.log('initGoogle called with clientId:', clientId)
  
  if (!clientId) {
    status.value = {
      message: 'Missing Google client ID. Create a .env.local file with GOOGLE_CLIENT_ID=your_client_id',
      type: 'error',
    }
    return
  }

  try {
    status.value = { message: 'Loading Google Sign-In...', type: 'info' }
    console.log('Loading Google script...')
    await ensureScript()
    
    status.value = { message: 'Initializing Google Authentication...', type: 'info' }
    console.log('Initializing Google Identity...')
    
    const googleIdentity = window.google as unknown as GoogleIdentity
    googleIdentity.accounts.id.initialize({
      client_id: clientId,
      hosted_domain: 'gbox.adnu.edu.ph',
      callback: handleGoogleCredential,
    })
    
    status.value = { message: 'Rendering sign-in button...', type: 'info' }
    console.log('Rendering button on element:', buttonEl.value)
    
    if (buttonEl.value) {
      googleIdentity.accounts.id.renderButton(buttonEl.value, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'center',
      })
    }
    
    console.log('Calling prompt...')
    googleIdentity.accounts.id.prompt()
    status.value = { message: 'Ready for authentication. Click the button above to sign in.', type: 'info' }
    console.log('Google Sign-In initialization complete')
  } catch (error) {
    console.error('Google Sign-In initialization error:', error)
    status.value = { 
      message: `Failed to initialize Google Sign-In: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      type: 'error' 
    }
  }
}

onMounted(async () => {
  console.log('AuthSignInPanel mounted, user:', user.value, 'clientId:', clientId)
  
  if (user.value) {
    console.log('User already authenticated, redirecting to:', props.redirectTo)
    await navigateTo(props.redirectTo)
    return
  }
  
  console.log('Starting Google initialization...')
  await initGoogle()
})
</script>

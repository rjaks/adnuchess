import { navigateTo } from '#imports'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicPaths = ['/welcome', '/login']

  // Skip middleware for Nuxt internal routes and API routes
  if (to.path.startsWith('/_nuxt') || to.path.startsWith('/__nuxt_error') || to.path.startsWith('/api/')) {
    return
  }

  const auth = useAuth()

  // If we're on client side and auth hasn't been initialized yet, initialize it first
  if (process.client && !auth.isInitialized.value) {
    try {
      await auth.refresh()
    } catch (error) {
      console.error('Auth refresh failed:', error)
    }
  }

  // Wait for auth state to be available before making redirect decisions
  if (process.server || auth.isInitialized.value) {
    // Only redirect if user is NOT authenticated and trying to access protected routes
    if (!auth.user.value && !publicPaths.includes(to.path)) {
      return navigateTo('/welcome')
    }

    // Only redirect from public paths if user IS authenticated
    // Skip this redirect if we're coming from a login flow (to avoid redirect loops)
    if (auth.user.value && publicPaths.includes(to.path) && from.path !== '/login') {
      return navigateTo('/')
    }
  }
})


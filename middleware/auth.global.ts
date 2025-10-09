import { navigateTo } from '#imports'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicPaths = ['/welcome', '/login']
  const adminPaths = ['/admin'] // Allow admin pages to load for everyone

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
    // Allow admin pages to load for everyone (they handle access control internally)
    if (adminPaths.some(path => to.path.startsWith(path))) {
      return
    }

    // Only redirect if user is NOT authenticated and trying to access protected routes
    if (!auth.user.value && !publicPaths.includes(to.path)) {
      return navigateTo('/welcome')
    }

    // Only redirect from public paths if user IS authenticated
    if (auth.user.value && publicPaths.includes(to.path)) {
      return navigateTo('/')
    }
  }
})


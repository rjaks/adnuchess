import { navigateTo } from '#imports'
import { useAuth } from '~/composables/useAuth'
import { api } from '../convex/_generated/api'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const publicPaths = ['/welcome', '/login', '/profile-setup']
  const adminPaths = ['/admin'] // Allow admin pages to load for everyone

  // Skip middleware for Nuxt internal routes and API routes
  if (to.path.startsWith('/_nuxt') || to.path.startsWith('/__nuxt_error') || to.path.startsWith('/api/')) {
    return
  }

  console.log('🛡️ Auth middleware:', { to: to.path, from: from?.path })

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
      console.log('🔄 Middleware: Redirecting unauthenticated user to welcome')
      return navigateTo('/welcome')
    }

    // Only redirect from public paths if user IS authenticated
    // Exception: allow authenticated users to access profile-setup
    if (auth.user.value && publicPaths.includes(to.path) && to.path !== '/profile-setup') {
      console.log('🔄 Middleware: Redirecting authenticated user from public path to home')
      return navigateTo('/')
    }

    // Profile setup logic (only on client side where Convex is available)
    // Skip profile check if user is already on profile-setup page
    if (process.client && auth.user.value && to.path !== '/profile-setup' && !publicPaths.includes(to.path)) {
      const user = auth.user.value
      const { $convex } = useNuxtApp()

      try {
        await $convex.mutation(api.profiles.upsertFromSession, {
          userId: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        })

        const profile = await $convex.query(api.profiles.getByUserId, {
          userId: user.id,
        })

        // Only redirect to profile setup if profile is incomplete
        if (!profile?.role) {
          console.log('🔄 Middleware: Redirecting to profile setup (incomplete profile)', { 
            from: to.path, 
            userId: user.id,
            hasRole: !!profile?.role 
          })
          return navigateTo('/profile-setup')
        } else {
          console.log('✅ Middleware: Profile complete, allowing navigation', {
            to: to.path,
            hasRole: !!profile?.role
          })
        }
      } catch (error) {
        console.error('Profile setup failed:', error)
      }
    }
  }
})


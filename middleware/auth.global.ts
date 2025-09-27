import { navigateTo } from '#imports'
import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ['/welcome', '/login']

  if (to.path.startsWith('/_nuxt') || to.path.startsWith('/__nuxt_error') || to.path.startsWith('/api/')) {
    return
  }

  const auth = useAuth()

  if (!auth.user.value) {
    await auth.refresh()
  }

  if (!auth.user.value) {
    if (!publicPaths.includes(to.path)) {
      return navigateTo('/welcome')
    }
    return
  }

  if (publicPaths.includes(to.path)) {
    return navigateTo('/')
  }
})


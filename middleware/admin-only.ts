import { isAdminEmail } from '~/config/admin'

export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  
  // Check if user is logged in and authorized
  if (!user.value || !isAdminEmail(user.value.email)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Denied: Admin privileges required. Contact IT support if you believe this is an error.'
    })
  }
})
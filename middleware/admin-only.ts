export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()
  
  // Authorized ADNU personnel emails
  const adminEmails = [
    'lojenar@gbox.adnu.edu.ph', // Your email
    // Add other authorized ADNU admin emails here as needed
    // 'admin@gbox.adnu.edu.ph',
    // 'it.admin@gbox.adnu.edu.ph',
    // 'faculty.admin@gbox.adnu.edu.ph'
  ]
  
  // Check if user is logged in and authorized
  if (!user.value || !adminEmails.includes(user.value.email)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access Denied: Admin privileges required. Contact IT support if you believe this is an error.'
    })
  }
})
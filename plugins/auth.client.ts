export default defineNuxtPlugin(async () => {
  // This plugin runs only on the client side after hydration
  // It ensures auth state is properly restored without causing redirects during page refresh
  
  const { refresh } = useAuth()
  
  // Wait for hydration to complete before attempting to refresh auth
  await nextTick()
  
  try {
    await refresh()
  } catch (error) {
    // Silently handle auth refresh errors
    // The middleware will handle redirects if necessary
    console.debug('Auth initialization failed:', error)
  }
})
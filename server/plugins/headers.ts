export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (response, { event }) => {
    // Set COOP headers for Google Auth compatibility
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    response.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
    
    // Allow Google domains for auth
    if (event.node.req.url?.includes('/auth/') || event.node.req.url?.includes('/login/')) {
      response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    }
  })
})

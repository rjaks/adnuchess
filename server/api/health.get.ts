export default defineEventHandler((event) => {
  // Set headers for COOP/COEP compatibility
  setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  setHeader(event, 'Cross-Origin-Embedder-Policy', 'unsafe-none')
  
  return { 
    status: 'ok', 
    message: 'Working',
    headers: {
      coop: 'same-origin-allow-popups',
      coep: 'unsafe-none'
    }
  }
})

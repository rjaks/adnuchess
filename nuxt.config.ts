const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const publicGoogleClientId = process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
const sessionTtlDays = parseInt(process.env.SESSION_TTL_DAYS || '7')

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: { cssPath: '~/assets/css/tailwind.css' },
  css: [],
  compatibilityDate: '2025-09-19',
  ssr: true,
  runtimeConfig: {
    googleClientId,
    sessionTtlDays,
    public: {
      googleClientId: publicGoogleClientId,
      // 👇 add this line
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL || '',
    },
  },
  nitro: {
    externals: {
      inline: ['google-auth-library'],
    },
  },
  // Ensure proper hydration without mismatches
  experimental: {
    payloadExtraction: false
  }
})

const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const publicGoogleClientId = process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: { cssPath: '~/assets/css/tailwind.css' },
  css: [],
  compatibilityDate: '2025-09-19',
  runtimeConfig: {
    googleClientId,
    public: {
      googleClientId: publicGoogleClientId,
    },
  },
  nitro: {
    externals: {
      inline: ['google-auth-library'],
    },
  },
})

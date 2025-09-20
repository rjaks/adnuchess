export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', 'convex-nuxt'],
  tailwindcss: { cssPath: '~/assets/css/tailwind.css' },
  css: [],
  compatibilityDate: '2025-09-19',
  convex: {
    url: process.env.CONVEX_URL
  }
})
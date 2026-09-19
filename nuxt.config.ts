import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true, typeCheck: true },
  app: {
    head: {
      title: 'Notification Apocalypse',
      meta: [
        { name: 'description', content: 'Finish your report while every app on Earth fights for your attention.' },
        { name: 'theme-color', content: '#07111f' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
  },
})

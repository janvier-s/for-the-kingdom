import { createApp, type Ref, computed } from 'vue' // Import Ref and computed if needed elsewhere, but not for composable defs
import { createPinia } from 'pinia'
import { VueQueryPlugin, VueQueryPluginOptions } from '@tanstack/vue-query' // Import Vue Query Plugin

import App from './App.vue'
import router from './router'
import './assets/main.css'
// Correct the import path if you renamed the store file
import { useAuthStore } from './stores/auth.store' // Assuming you renamed it to auth.store.ts

const app = createApp(App)
const pinia = createPinia()

// Vue Query Options (Optional)
const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // Default stale time for all queries (5 minutes)
        gcTime: 10 * 60 * 1000, // Default garbage collection time (10 minutes)
        refetchOnWindowFocus: false, // Optional: disable refetch on window focus
      },
    },
  },
}

app.use(pinia)
app.use(router)
app.use(VueQueryPlugin, vueQueryPluginOptions) // Install Vue Query Plugin

// Initialize Auth Store (Corrected import name)
const authStore = useAuthStore() // Use the correct store name
authStore
  .init()
  .then(() => {
    console.log('Auth initialized, mounting app.')
    app.mount('#app')
  })
  .catch((error) => {
    console.error('Failed to initialize application:', error)
    // Handle critical initialization failure (e.g., show error message)
    // Mounting anyway might lead to a broken state
    app.mount('#app')
  })

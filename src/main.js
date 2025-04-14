import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useSupabaseStore } from './stores/supabase'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize Supabase auth state before mounting the app
const supabaseStore = useSupabaseStore(pinia)
supabaseStore.init().then(() => {
  // Mount the app after Supabase is initialized
  app.mount('#app')
}).catch(error => {
  console.error('Failed to initialize Supabase:', error)
  // Mount the app anyway, even if Supabase initialization fails
  app.mount('#app')
})

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css' //
import { useSupabaseStore } from './stores/supabase'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const supabaseStore = useSupabaseStore(pinia)
supabaseStore
  .init()
  .then(() => {
    app.mount('#app')
  })
  .catch((error) => {
    console.error('Failed to initialize Supabase:', error)
    app.mount('#app')
  })

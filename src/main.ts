// src/main.js (or main.ts)
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Assuming you have router setup
import { createPinia } from 'pinia' // For state management
import naive from 'naive-ui'

// General Fonts
import 'vfonts/Lato.css'
// Monospace Fonts
import 'vfonts/FiraCode.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(naive) // Use Naive UI globally

app.mount('#app')

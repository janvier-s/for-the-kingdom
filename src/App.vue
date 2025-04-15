<script setup>
import { onMounted, ref } from 'vue'

const isDarkMode = ref(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  const rootEl = document.documentElement
  if (isDarkMode.value) {
    rootEl.classList.add('dark')
    localStorage.setItem('theme', 'dark')
    console.log('Switched to Dark Mode')
  } else {
    rootEl.classList.remove('dark')
    localStorage.setItem('theme', 'light')
    console.log('Switched to Light Mode')
  }
}

onMounted(() => {
  const rootEl = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const savedTheme = localStorage.getItem('theme')
  console.log('Initial check - prefersDark:', prefersDark, 'savedTheme:', savedTheme)

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDarkMode.value = true
    rootEl.classList.add('dark')
    console.log('Setting initial theme to Dark')
  } else {
    isDarkMode.value = false
    rootEl.classList.remove('dark')
    console.log('Setting initial theme to Light')
  }
})
</script>

<template>
  <div id="app-wrapper">
    <header class="app-header">
      <button @click="toggleDarkMode" class="theme-toggle">
        {{ isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode' }}
      </button>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  padding: 10px 20px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-divider);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.theme-toggle {
  padding: 8px 15px;
  border: 1px solid var(--border-primary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all var(--transition-std);
}

.theme-toggle:hover {
  background-color: var(--bg-secondary);
  border-color: var(--border-hover);
}

main {
  flex-grow: 1;
  padding: 20px;
}
</style>

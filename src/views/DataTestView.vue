<template>
  <div class="data-test-view">
    <header>
      <h1>Supabase Integration Test</h1>
      <nav>
        <router-link to="/">Home</router-link>
      </nav>
    </header>

    <main>
      <DataTest />
    </main>

    <footer>
      <p>This page demonstrates the Supabase integration.</p>
    </footer>
  </div>
</template>

<script setup>
import DataTest from '../components/DataTest.vue'
</script>

<style scoped>
.data-test-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

header h1 {
  margin: 0;
  color: #333;
}

nav {
  display: flex;
  gap: 15px;
}

nav a {
  text-decoration: none;
  color: #2c3e50;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
}

nav a:hover {
  background-color: #f0f0f0;
}

main {
  min-height: 70vh;
}

footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
  color: #666;
}
</style>

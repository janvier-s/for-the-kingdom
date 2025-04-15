<template>
  <div class="home-view">
    <h1>Bible Testaments</h1>

    <div v-if="isLoading" class="loading">Loading testament information...</div>
    <div v-else-if="error" class="error-message">Error loading testaments: {{ error }}</div>

    <section v-else-if="testaments.length > 0" class="testament-sections">
      <div
        v-for="testament in testaments"
        :key="testament.testament_id"
        class="testament-section"
        @click="goToTestament(testament.slug)"
        role="link"
        tabindex="0"
        @keydown.enter="goToTestament(testament.slug)"
      >
        <h2>{{ testament.name }}</h2>
      </div>
    </section>

    <p v-else>No testaments found in the database.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../supabase'

const router = useRouter()
const testaments = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchTestaments = async () => {
  isLoading.value = true
  error.value = null
  testaments.value = []
  try {
    const { data, error: fetchError } = await supabase
      .from('testaments')
      .select('testament_id, name, slug')
      .order('testament_id')
    if (fetchError) throw fetchError
    testaments.value = data
  } catch (err) {
    console.error('Error fetching testaments:', err)
    error.value = err.message || 'Failed to load testament list.'
  } finally {
    isLoading.value = false
  }
}

const goToTestament = (slug) => {
  if (!slug) {
    console.error('Cannot navigate: slug is undefined')
    return
  }
  router.push({ name: 'testament-detail', params: { testamentSlug: slug } })
}

onMounted(() => {
  fetchTestaments()
})
</script>

<style scoped>
.home-view {
  padding: 20px;
  max-width: 900px; /* Adjusted max-width */
  margin: 2rem auto; /* Added top/bottom margin */
}

h1 {
  text-align: center;
  margin-bottom: 2rem; /* Increased margin */
  color: #2c3e50; /* Darker heading color */
  font-weight: 300; /* Lighter font weight */
  letter-spacing: 1px;
}

.loading {
  text-align: center;
  color: #666;
  margin: 40px 0;
  font-style: italic;
}

.error-message {
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  padding: 15px; /* Increased padding */
  border-radius: 4px;
  margin: 20px 0;
  text-align: center;
}

.testament-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive columns */
  gap: 25px; /* Increased gap */
}

.testament-section {
  border: 1px solid #dce4ec; /* Softer border */
  padding: 30px 20px; /* Increased padding */
  border-radius: 8px;
  background-color: #ffffff; /* White background */
  transition:
    background-color 0.2s ease-in-out,
    transform 0.2s ease-in-out,
    /* Smoother transform */ box-shadow 0.2s ease-in-out; /* Added shadow transition */
  cursor: pointer;
  outline: none;
  text-align: center; /* Center the heading */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04); /* Subtle shadow */
}

.testament-section:hover,
.testament-section:focus {
  background-color: #f8fafd; /* Light blueish hover */
  transform: translateY(-4px); /* Slightly more lift */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08); /* Enhanced shadow on hover */
}

.testament-section h2 {
  color: #34495e; /* Darker blue-grey heading */
  margin: 0; /* Remove default margin */
  font-weight: 400; /* Normal weight */
  font-size: 1.4rem; /* Slightly larger heading */
}
</style>

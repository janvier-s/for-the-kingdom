<template>
  <div class="home-view container">
    <h1>Testaments de la Bible</h1>

    <div v-if="isLoading" class="loading-text">Loading testament information...</div>
    <div v-else-if="error" class="error-box">Error loading testaments: {{ error }}</div>

    <section v-else-if="testaments.length > 0" class="testament-sections">
      <div
        v-for="testament in testaments"
        :key="testament.testament_id"
        class="testament-section card-link"
        @click="goToTestament(testament.slug)"
        role="link"
        tabindex="0"
        @keydown.enter="goToTestament(testament.slug)"
      >
        <h2>{{ testament.name }}</h2>
      </div>
    </section>

    <p v-else style="text-align: center; color: var(--text-secondary)">
      No testaments found in the database.
    </p>
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
.testament-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Slightly larger min width */
  gap: var(--spacing-xl); /* Use variable for gap */
  margin-top: var(--spacing-xl); /* Add some space above the grid */
}

/* Enhance the card styles provided by .card-link (from main.css) */
.testament-section {
  /* Override/Enhance padding */
  padding: var(--spacing-xl) var(--spacing-lg);
  /* Ensure background uses variable */
  background-color: var(--bg-secondary);
  /* Ensure border uses variable */
  border: 1px solid var(--border-primary);
  /* Ensure border-radius uses variable */
  border-radius: var(--radius-lg);
  /* More pronounced base shadow */
  box-shadow: 0 4px 6px var(--shadow-color-light);
  /* Ensure transitions cover transform and shadow */
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-std),
    border-color var(--transition-std);
  cursor: pointer;
  outline: none;
  text-align: center;
  display: flex; /* Use flexbox for alignment */
  flex-direction: column; /* Stack content vertically */
  justify-content: center; /* Center content vertically */
  align-items: center; /* Center content horizontally */
  min-height: 150px; /* Give cards a minimum height */
}

.testament-section:hover,
.testament-section:focus {
  transform: translateY(-2px) scale(1.002);
  box-shadow: 0 10px 20px var(--shadow-color-light);
}

.testament-section h2 {
  color: var(--text-heading);
  margin: 0;
  font-weight: 500; /* Medium weight */
  font-size: 1.6rem; /* Larger title */
  letter-spacing: 0.5px;
  line-height: 1.3;
}
</style>

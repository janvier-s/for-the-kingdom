// views/HomeView.vue
<template>
  <div class="home-view">
    <h1>Bible Testaments</h1>

    <div v-if="isLoading" class="loading">Loading testament information...</div>
    <div v-else-if="error" class="error-message">Error loading testaments: {{ error }}</div>

    <section v-else-if="testaments.length > 0" class="testament-sections">
      <!-- Use a div with @click for navigation -->
      <div
        v-for="testament in testaments"
        :key="testament.testament_id"
        class="testament-section"
        @click="goToTestament(testament.slug)"
        role="link"
        tabindex="0"
        @keydown.enter="goToTestament(testament.slug)"
      >
        <!-- Content stays inside the div -->
        <h2>{{ testament.name }}</h2>
        <!-- Add console log here to check props being passed -->
        {{ logTestamentProps(testament) }}
        <TestamentTypeList
          :testament-id="testament.testament_id"
          :testament-slug="testament.slug"
        />
        <!-- End Content -->
      </div>
    </section>

    <p v-else>No testaments found in the database.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router' // Import useRouter for navigation
import supabase from '../supabase'
import TestamentTypeList from '../components/TestamentTypeList.vue'

const router = useRouter() // Initialize router instance
const testaments = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchTestaments = async () => {
  // ... fetchTestaments function remains the same ...
  isLoading.value = true
  error.value = null
  testaments.value = []
  console.log('Fetching list of testaments for homepage...')
  try {
    const { data, error: fetchError } = await supabase
      .from('testaments')
      .select('testament_id, name, slug')
      .order('testament_id')
    if (fetchError) throw fetchError
    testaments.value = data
    console.log('Fetched testaments:', data)
  } catch (err) {
    console.error('Error fetching testaments:', err)
    error.value = err.message || 'Failed to load testament list.'
  } finally {
    isLoading.value = false
  }
}

// Method to navigate programmatically
const goToTestament = (slug) => {
  if (!slug) {
    console.error('Cannot navigate: slug is undefined')
    return
  }
  console.log(`Navigating to testament with slug: ${slug}`)
  router.push({ name: 'testament-detail', params: { testamentSlug: slug } })
}

// Helper function for inline logging in template (for debugging)
const logTestamentProps = (testament) => {
  console.log(`Props being passed for ${testament.name}:`, {
    testamentId: testament.testament_id,
    testamentSlug: testament.slug,
  })
  // This function doesn't render anything, just logs
}

onMounted(() => {
  fetchTestaments()
})
</script>

<style scoped>
/* ... other styles remain the same ... */
.home-view {
  /* ... */
}
h1 {
  /* ... */
}
.loading {
  /* ... */
}
.error-message {
  /* ... */
}
.testament-sections {
  /* ... */
}

/* Ensure the div is styled to be clickable */
.testament-section {
  border: 1px solid #eee;
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition:
    background-color 0.2s ease-in-out,
    transform 0.1s ease-in-out;
  cursor: pointer; /* Add pointer cursor */
  outline: none; /* Remove default focus outline if desired, or style it */
}

.testament-section:hover,
.testament-section:focus {
  /* Add focus style */
  background-color: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.testament-section h2 {
  /* ... */
  color: #333; /* Ensure heading color is consistent */
}
</style>

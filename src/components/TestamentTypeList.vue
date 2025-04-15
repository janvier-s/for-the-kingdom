<template>
  <div class="testament-type-list">
    <p v-if="isLoading">Loading types...</p>
    <p v-else-if="error">Error loading types: {{ error }}</p>
    <div v-else-if="types.length > 0">
      <router-link
        v-for="type in types"
        :key="type.slug"
        :to="{
          name: 'type-detail-by-slug',
          params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
        }"
        class="type-link"
      >
        {{ type.name }}
      </router-link>
    </div>
    <p v-else>No types found for this testament.</p>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  testamentId: {
    type: Number,
    required: true,
  },
  testamentSlug: {
    type: String,
    required: true,
  },
})

const types = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchTypes = async (id) => {
  if (typeof id !== 'number' || isNaN(id)) {
    types.value = []
    error.value = `Invalid Testament ID received: ${id}`
    isLoading.value = false
    console.error(error.value)
    return
  }

  isLoading.value = true
  error.value = null
  types.value = []

  try {
    const { data, error: fetchError } = await supabase
      .from('types')
      .select('name, slug')
      .eq('testament_id', id)

    if (fetchError) {
      throw fetchError
    }

    types.value = data
  } catch (err) {
    error.value = err.message || `Failed to fetch types for Testament ID ${id}`
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.testamentId,
  (newId) => {
    fetchTypes(newId)
  },
  { immediate: true },
)
</script>

<style scoped>
.testament-type-list {
  /* Can add padding/margin here if needed, but often handled by parent */
  /* padding: 10px 0; */
}

.loading,
.testament-type-list > p:last-child {
  /* Target loading and 'No types found' */
  text-align: center;
  color: #6c757d; /* Softer grey */
  margin: 20px 0;
  padding: 10px;
  font-style: italic;
  background-color: #f8f9fa; /* Very light grey background */
  border-radius: 4px;
}

.error-message {
  /* Consistent error styling */
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  padding: 15px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
}

.type-link {
  display: block; /* Make link take full width */
  text-decoration: none;
  color: #34495e; /* Match heading color */
  background-color: #ffffff;
  border: 1px solid #e1e8ed; /* Slightly different border */
  padding: 12px 18px; /* Adjust padding */
  margin-bottom: 10px; /* Space between links */
  border-radius: 6px; /* Slightly less rounded */
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.type-link:hover,
.type-link:focus {
  background-color: #f8fafd;
  border-color: #cdddeb; /* Lighter blue border on hover */
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
  outline: none; /* Remove focus outline if desired */
}

.type-link:last-child {
  margin-bottom: 0; /* Remove bottom margin from the last link */
}
</style>

<template>
  <div class="testament-type-list">
    <p v-if="isLoading" class="loading-text">Loading types...</p>
    <p v-else-if="error" class="error-box">Error loading types: {{ error }}</p>
    <div v-else-if="types.length > 0">
      <router-link
        v-for="type in types"
        :key="type.slug"
        :to="{
          name: 'type-detail-by-slug',
          params: { testamentSlug: props.testamentSlug, typeSlug: type.slug },
        }"
        class="type-link list-item-link"
      >
        {{ type.name }}
      </router-link>
    </div>
    <p v-else style="text-align: center; color: var(--text-secondary)">
      No types found for this testament.
    </p>
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

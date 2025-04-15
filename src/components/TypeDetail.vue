<template>
  <div class="type-detail">
    <div v-if="isLoadingType">Loading type details...</div>
    <div v-else-if="typeError" class="error-message">Error loading type: {{ typeError }}</div>

    <div v-else-if="typeData">
      <h2>{{ typeData.name }}</h2>
      <p v-if="typeName !== typeData.name">(Requested Type Name: {{ typeName }})</p>

      <div v-if="isLoadingBooks" class="loading">Loading books...</div>
      <div v-else-if="booksError" class="error-message">Error loading books: {{ booksError }}</div>

      <ul v-else-if="books.length > 0" class="book-list">
        <li v-for="book in books" :key="book.book_id">
          {{ book.title }}
        </li>
      </ul>
      <p v-else>No books found for this type.</p>
    </div>
    <div v-else>
      <!-- This case might happen if the type name doesn't exist -->
      <p class="error-message">Type '{{ typeName }}' not found.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, ref } from 'vue'
import supabase from '../supabase'

// --- Props ---
const props = defineProps({
  typeName: {
    type: String,
    required: true,
  },
})

// --- Reactive State ---
const typeData = ref(null) // To store the full data for the type (including id)
const books = ref([]) // To store the list of books for this type
const isLoadingType = ref(true) // Loading state for fetching the type
const typeError = ref(null) // Error state for fetching the type
const isLoadingBooks = ref(false) // Loading state for fetching books (starts false)
const booksError = ref(null) // Error state for fetching books

// --- Functions ---

// Function to fetch books associated with a specific type ID
const fetchBooksForType = async (typeId) => {
  if (!typeId) {
    booksError.value = 'Cannot fetch books without a valid Type ID.'
    return
  }

  isLoadingBooks.value = true
  booksError.value = null
  books.value = [] // Clear previous books

  console.log(`Fetching books for type_id: ${typeId}`)

  try {
    const { data, error: fetchError } = await supabase
      .from('books')
      .select('*') // Select all book columns or specific ones needed
      .eq('type_id', typeId)
      .order('bible_order') // Order books correctly

    if (fetchError) {
      throw fetchError // Throw error to be caught below
    }

    books.value = data
    console.log('Fetched books:', data)
  } catch (err) {
    console.error('Error fetching books for type:', err)
    booksError.value = err.message || 'Failed to fetch books'
  } finally {
    isLoadingBooks.value = false
  }
}

// Function to fetch the type's data (including its ID)
const fetchTypeData = async () => {
  isLoadingType.value = true
  typeError.value = null
  typeData.value = null
  books.value = []
  isLoadingBooks.value = false
  booksError.value = null

  console.log(`Fetching data for type name: ${props.typeName}`)

  try {
    const { data, error: fetchError } = await supabase
      .from('types')
      .select('type_id, name')
      .eq('name', props.typeName)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // PostgREST code for "exact one row not found"
        throw new Error(`Type '${props.typeName}' not found.`)
      } else {
        throw fetchError // Throw other DB errors
      }
    }

    typeData.value = data
    console.log('Fetched type data:', data)

    if (data && data.type_id) {
      await fetchBooksForType(data.type_id)
    } else {
      booksError.value = 'Could not determine Type ID to fetch books.'
    }
  } catch (err) {
    console.error('Error fetching type data:', err)
    typeError.value = err.message || 'Failed to fetch type data'
  } finally {
    isLoadingType.value = false
  }
}

onMounted(() => {
  fetchTypeData()
})
</script>

<style scoped>
.type-detail {
  padding: 20px;
  margin: 20px 0;
}

.book-list {
  list-style: none;
  padding: 0;
  margin-top: 15px;
}

.book-list li {
  padding: 5px 0;
  border-bottom: 1px dashed #eee;
}

.book-list li:last-child {
  border-bottom: none;
}

.loading {
  color: #666;
  margin: 10px 0;
}

.error-message {
  color: #d9534f; /* Red color for errors */
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}
</style>

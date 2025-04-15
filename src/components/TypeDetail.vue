<template>
  <div class="type-detail">
    <div v-if="isLoadingType">Loading type details...</div>
    <div v-else-if="typeError" class="error-message">Error loading type: {{ typeError }}</div>

    <div v-else-if="typeData">
      <h2>{{ typeData.name }}</h2>

      <div v-if="isLoadingBooks" class="loading">Loading books...</div>
      <div v-else-if="booksError" class="error-message">Error loading books: {{ booksError }}</div>

      <ul v-else-if="books.length > 0" class="book-list">
        <li v-for="book in books" :key="book.book_id">
          <router-link
            :to="{
              name: 'book-detail-by-slug',
              params: {
                testamentSlug: props.testamentSlug,
                typeSlug: props.typeSlug,
                bookSlug: book.slug,
              },
            }"
          >
            {{ book.title }}
          </router-link>
        </li>
      </ul>
      <p v-else>No books found for this type.</p>
    </div>
    <div v-else>
      <p class="error-message">Type with slug '{{ typeSlug }}' not found.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, watch } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  testamentSlug: {
    type: String,
    required: true,
  },
  typeSlug: {
    type: String,
    required: true,
  },
})

const typeData = ref(null)
const books = ref([])
const isLoadingType = ref(true)
const typeError = ref(null)
const isLoadingBooks = ref(false)
const booksError = ref(null)

const fetchBooksForType = async (typeId) => {
  if (!typeId) {
    booksError.value = 'Cannot fetch books without a valid Type ID.'
    return
  }
  isLoadingBooks.value = true
  booksError.value = null
  books.value = []
  try {
    const { data, error: fetchError } = await supabase
      .from('books')
      .select('book_id, title, abbr, slug')
      .eq('type_id', typeId)
      .order('bible_order')
    if (fetchError) throw fetchError
    books.value = data
  } catch (err) {
    booksError.value = err.message || 'Failed to fetch books'
  } finally {
    isLoadingBooks.value = false
  }
}

const fetchTypeData = async (slugToFetch) => {
  isLoadingType.value = true
  typeError.value = null
  typeData.value = null
  books.value = []
  isLoadingBooks.value = false
  booksError.value = null

  try {
    const { data, error: fetchError } = await supabase
      .from('types')
      .select('type_id, name, slug')
      .eq('slug', slugToFetch)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error(`Type with slug '${slugToFetch}' not found.`)
      } else {
        throw fetchError
      }
    }

    typeData.value = data

    if (data && data.type_id) {
      await fetchBooksForType(data.type_id)
    } else {
      booksError.value = 'Could not determine Type ID to fetch books.'
    }
  } catch (err) {
    typeError.value = err.message || 'Failed to fetch type data'
  } finally {
    isLoadingType.value = false
  }
}

watch(
  () => props.typeSlug,
  (newSlug) => {
    if (newSlug) {
      fetchTypeData(newSlug)
    }
  },
  { immediate: true },
)
</script>

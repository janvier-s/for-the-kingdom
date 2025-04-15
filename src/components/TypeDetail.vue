<template>
  <div class="type-detail">
    <div v-if="isLoadingType">Loading type details...</div>
    <div v-else-if="typeError" class="error-message">Error loading type: {{ typeError }}</div>
    <header v-else-if="typeName">
      <h2>{{ typeName }}</h2>
    </header>
    <div v-else>
      <p class="error-message">Type details could not be loaded.</p>
    </div>

    <div v-if="actualTypeId && !isLoadingType && !typeError">
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
      <p v-else>No books found for this type in the selected language.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, watch } from 'vue'
import supabase from '../supabase'

const props = defineProps({
  testamentSlug: { type: String, required: false },
  typeSlug: { type: String, required: true },
})

const typeName = ref('')
const actualTypeId = ref(null)
const books = ref([])
const frenchLangId = ref(null)

const isLoadingType = ref(true)
const typeError = ref(null)
const isLoadingBooks = ref(false)
const booksError = ref(null)

const getLanguageId = async (langName) => {
  if (frenchLangId.value) return frenchLangId.value
  try {
    const { data, error: langError } = await supabase
      .from('languages')
      .select('lang_id')
      .eq('lang', langName)
      .single()
    if (langError) throw langError
    if (!data) throw new Error(`Language '${langName}' not found.`)
    frenchLangId.value = data.lang_id
    return data.lang_id
  } catch (err) {
    console.error(`Error fetching language ID for ${langName}:`, err)
    throw new Error(`Failed to find language ID for ${langName}. ${err.message}`)
  }
}

const fetchTypeDetails = async (slug, langId) => {
  if (!slug || !langId) {
    throw new Error('Slug or Language ID missing for fetching type details.')
  }

  const { data, error: fetchError } = await supabase
    .from('type_translations')
    .select('name, type_id')
    .eq('slug', slug)
    .eq('lang_id', langId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error(`Type with slug '${slug}' not found for the selected language.`)
    } else {
      throw fetchError
    }
  }
  if (!data) throw new Error(`Type with slug '${slug}' not found.`)

  typeName.value = data.name
  actualTypeId.value = data.type_id
}

const fetchBooksForType = async (typeId, langId) => {
  if (!typeId || !langId) {
    booksError.value = 'Cannot fetch books without a valid Type ID or Language ID.'
    return
  }
  isLoadingBooks.value = true
  booksError.value = null
  books.value = []

  try {
    const { data, error: fetchError } = await supabase
      .from('books')
      .select(
        `
            book_id,
            bible_order,
            book_translations!inner (
                title,
                abbr,
                slug
            )
        `,
      )
      .eq('type_id', typeId)
      .eq('book_translations.lang_id', langId)
      .order('bible_order', { ascending: true })

    if (fetchError) throw fetchError

    books.value = (data || [])
      .map((book) => ({
        book_id: book.book_id,
        bible_order: book.bible_order,
        title: book.book_translations[0]?.title || 'Unknown Title',
        abbr: book.book_translations[0]?.abbr || 'N/A',
        slug: book.book_translations[0]?.slug || `book-${book.book_id}`,
      }))
      .filter((book) => book.book_translations !== null)
  } catch (err) {
    console.error('Error fetching books for type:', err)
    booksError.value = err.message || 'Failed to fetch books'
  } finally {
    isLoadingBooks.value = false
  }
}

const loadDataForType = async (slug) => {
  isLoadingType.value = true
  isLoadingBooks.value = true
  typeError.value = null
  booksError.value = null
  typeName.value = ''
  actualTypeId.value = null
  books.value = []

  try {
    const langId = await getLanguageId('Français')

    await fetchTypeDetails(slug, langId)

    if (actualTypeId.value) {
      await fetchBooksForType(actualTypeId.value, langId)
    } else {
      isLoadingBooks.value = false
    }
  } catch (err) {
    console.error('Error loading data for type:', err)
    typeError.value = err.message || 'Failed to load type or book data.'
    isLoadingBooks.value = false
  } finally {
    isLoadingType.value = false
  }
}

watch(
  () => props.typeSlug,
  (newSlug) => {
    if (newSlug) {
      loadDataForType(newSlug)
    } else {
      typeError.value = 'Invalid Type identifier provided.'
      isLoadingType.value = false
      isLoadingBooks.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.type-detail {
  padding: 1rem;
}
header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}
header h2 {
  color: var(--primary-color);
  text-align: center;
}
.book-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}
.book-list li {
  margin-bottom: 0.5rem;
}
.book-list a {
  text-decoration: none;
  color: var(--link-color);
}
.book-list a:hover {
  text-decoration: underline;
}
.loading,
.error-message {
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
}
.error-message {
  color: var(--error-color);
}
</style>

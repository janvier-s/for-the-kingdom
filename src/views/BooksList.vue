<template>
  <div>
    <h2>Books</h2>
    <ul>
      <li v-for="book in books" :key="book.book_id">
        <router-link :to="{ name: 'Chapters', params: { bookId: book.book_id } }">
          {{ book.title }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { fetchBooks } from '@/api/bibleData.js'

export default {
  name: 'BooksList',
  setup() {
    const books = ref([])

    const loadBooks = async () => {
      try {
        books.value = await fetchBooks()
      } catch (error) {
        console.error('Failed to load books:', error)
      }
    }

    onMounted(() => {
      loadBooks()
    })

    return { books }
  },
}
</script>

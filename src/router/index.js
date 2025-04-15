import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TestamentView from '../views/TestamentView.vue'
import TypeDetail from '../components/TypeDetail.vue'
import BookDetail from '../views/BookDetail.vue'
import supabase from '../supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/:testamentSlug',
      name: 'testament-detail',
      component: TestamentView,
      props: true,
      beforeEnter: async (to, from, next) => {
        const slug = to.params.testamentSlug
        console.log(`Route Guard: Finding testament ID and slug for: ${slug}`)
        try {
          const { data, error } = await supabase
            .from('testaments')
            .select('testament_id, slug')
            .eq('slug', slug)
            .single()

          if (error) throw error

          if (data) {
            console.log(`Route Guard: Found ID: ${data.testament_id}, Slug: ${data.slug}`)
            to.params.testamentId = data.testament_id
            to.params.testamentSlug = data.slug
            next()
          } else {
            console.warn(`Route Guard: No testament found for slug: ${slug}`)
            next(new Error(`Testament with slug '${slug}' not found.`))
          }
        } catch (err) {
          console.error('Error in testament route guard:', err)
          next(new Error(`Error finding testament: ${err.message}`))
        }
      },
    },
    {
      path: '/:testamentSlug/:typeSlug',
      name: 'type-detail-by-slug',
      component: TypeDetail,
      props: true,
    },
    {
      path: '/:testamentSlug/:typeSlug/:bookSlug',
      name: 'book-detail-by-slug',
      component: BookDetail,
      props: true,
      beforeEnter: async (to, from, next) => {
        const bookSlug = to.params.bookSlug
        try {
          const { data, error } = await supabase
            .from('books')
            .select('book_id, slug') // Fetch ID and slug
            .eq('slug', bookSlug) // Match book slug
            .single()

          if (error) throw error // Let catch block handle DB error

          if (data) {
            to.params.bookId = data.book_id
            next()
          } else {
            next(new Error(`Book with slug '${bookSlug}' not found.`))
          }
        } catch (err) {
          next(new Error(`Error finding book: ${err.message}`))
        }
      },
    },
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('../views/NotFoundView.vue'), // Example: Lazy load a 404 component
    // },
  ],
})
export default router

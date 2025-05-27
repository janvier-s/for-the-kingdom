/**
 * @file Vue Router configuration.
 * Defines application routes, navigation guards, and lazy loading.
 */
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type NavigationGuardNext,
  type RouteLocationNormalized,
} from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { fetchTestamentBySlug } from '@/_archive/services/apiService' // Use the service layer

// Define route names as constants for type safety and easier refactoring
const RouteNames = {
  HOME: 'home',
  TESTAMENT_DETAIL: 'testament-detail',
  GENRE_DETAIL: 'genre-detail',
  BOOK_DETAIL: 'book-detail',
  NOT_FOUND: 'not-found',
} as const // Use 'as const' for stricter typing

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: RouteNames.HOME,
    component: HomeView,
  },
  {
    path: '/:testamentSlug', // More descriptive path segment
    name: RouteNames.TESTAMENT_DETAIL,
    // Lazy load view components for better initial load performance
    component: () => import('@/views/TestamentView.vue'),
    props: true, // Pass route params as props
    // Navigation guard to validate slug and potentially fetch ID (though component composable handles it now)
    // This guard primarily acts as validation before loading the component.
    beforeEnter: async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext,
    ) => {
      const slug = to.params.testamentSlug as string
      console.debug(`Route Guard (${String(to.name)}): Validating testament slug: ${slug}`)
      if (!slug) {
        console.warn(`Route Guard (${String(to.name)}): Invalid slug provided.`)
        return next({ name: RouteNames.NOT_FOUND }) // Redirect if slug is missing
      }
      try {
        // Validate slug exists via API service - doesn't need to pass ID anymore
        await fetchTestamentBySlug(slug)
        console.debug(`Route Guard (${String(to.name)}): Slug validated successfully.`)
        next() // Proceed to load the component
      } catch (error) {
        console.error(
          `Route Guard (${String(to.name)}): Error validating testament slug '${slug}':`,
          error,
        )
        // Handle specific errors, e.g., not found
        if (error instanceof Error && error.message.includes('not found')) {
          next({ name: RouteNames.NOT_FOUND }) // Redirect to NotFound view
        } else {
          // For other errors, maybe show a generic error page or pass error info
          // For simplicity, redirecting to NotFound here too.
          next({ name: RouteNames.NOT_FOUND })
          // Or: next(new Error(`Failed to load testament: ${error.message}`)); // Pass error to global handler if set up
        }
      }
    },
  },
  {
    // Nested structure makes sense semantically
    path: '/:testamentSlug/:genreSlug',
    name: RouteNames.GENRE_DETAIL,
    component: () => import('@/views/GenreDetailView.vue'),
    props: true,
    // Optional: Add a beforeEnter guard similar to testament if needed for genre slug validation
  },
  {
    // Keep the full path for clarity, even if nested logically
    path: '/:testamentSlug/:genreSlug/:bookSlug',
    name: RouteNames.BOOK_DETAIL,
    component: () => import('@/views/BookDetailView.vue'),
    props: true,
    // Optional: Add a beforeEnter guard similar to testament if needed for book slug validation
  },
  {
    // Catch-all 404 route - Must be last
    path: '/:pathMatch(.*)*',
    name: RouteNames.NOT_FOUND,
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Optional: Add scroll behavior
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      // If navigating with a hash, scroll to the element
      return { el: to.hash, behavior: 'smooth' }
    } else {
      // Otherwise, scroll to the top of the page on new navigation
      return { top: 0, behavior: 'smooth' }
    }
  },
})

export default router

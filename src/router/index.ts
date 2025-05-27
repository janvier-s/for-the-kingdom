// src/router/index.js (or .ts)
import { createRouter, createWebHistory } from 'vue-router'
import MainContentArea from '../components/layout/MainContentArea.vue' // Your main Bible content view
// import HomeView from '../views/HomeView.vue' // Example if you have a separate home

const routes = [
  {
    path: '/',
    name: 'Home',
    // component: HomeView, // Or redirect to a default Bible view
    redirect: '/bible/GEN/1', // Redirect to a default chapter, e.g., Genesis 1
  },
  {
    // Route for when only a book is "selected" conceptually, but no chapter yet
    // This might not be strictly necessary if you always go to a chapter
    path: '/bible/:bookOsis',
    name: 'BibleBook',
    component: MainContentArea,
    props: true, // Pass route params (bookOsis) as props to MainContentArea
  },
  {
    path: '/bible/:bookOsis/:chapterNum',
    name: 'BibleChapter',
    component: MainContentArea, // MainContentArea will display the content
    props: true, // This will pass route params (bookOsis, chapterNum) as props to MainContentArea
  },
  // Fallback for /bible if no book/chapter is specified, redirect to a default
  {
    path: '/bible',
    redirect: '/bible/GEN/1',
  },
  // Add other top-level routes like /catechism, /commentary later
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating to a new chapter/book
    // or restore position if using browser back/forward
    if (savedPosition) {
      return savedPosition
    } else if (to.name === 'BibleChapter' || to.name === 'BibleBook') {
      // If navigating to a chapter, check if it's a different chapter than the previous one
      if (
        from.name === 'BibleChapter' &&
        (from.params.bookOsis !== to.params.bookOsis ||
          from.params.chapterNum !== to.params.chapterNum)
      ) {
        return { top: 0, behavior: 'smooth' }
      } else if (from.name !== 'BibleChapter') {
        // Coming from a different type of page
        return { top: 0, behavior: 'smooth' }
      }
    }
    return { top: 0 }
  },
})

export default router

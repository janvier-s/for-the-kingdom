import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TestamentView from '../views/TestamentView.vue'
// import AncienTestamentView from '../views/Old/AncienTestamentView.vue'
import TypeDetail from '../components/TypeDetail.vue'
import supabase from '../supabase'

// import DataTestView from '../views/DataTestView.vue'
// import BibleView from '../views/BibleView.vue'

// import BooksList from '../views/BooksList.vue'
// import ChaptersList from '../views/ChaptersList.vue'
// import VersesList from '../views/VersesList.vue'

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
        console.log(`Route Guard: Attempting to find testament with slug: ${slug}`)

        try {
          const { data, error } = await supabase
            .from('testaments')
            .select('testament_id')
            .eq('slug', slug)
            .single()

          if (error) {
            console.error('Error fetching testament ID from slug:', error)
            next(new Error(`Testament with slug '${slug}' not found or database error.`))
            return
          }

          if (data && data.testament_id) {
            console.log(`Route Guard: Found testament ID: ${data.testament_id} for slug: ${slug}`)
            to.params.testamentId = data.testament_id
            next()
          } else {
            console.warn(`Route Guard: No testament found for slug: ${slug}`)
            next(new Error(`Testament with slug '${slug}' not found.`))
            return
          }
        } catch (err) {
          console.error('Unexpected error in route guard:', err)
          next(err)
          return
        }
      },
    },
    {
      path: '/type/:typeName',
      name: 'type-detail',
      component: TypeDetail,
      props: true,
    },
    // {
    //   path: '/ancien-testament',
    //   name: 'ancien-testament',
    //   component: AncienTestamentView,
    // },
    {
      path: '/:typeName',
      name: 'type-detail',
      component: TypeDetail,
      props: true,
    },
    // {
    //   path: '/supabase-test',
    //   name: 'supabase-test',
    //   component: DataTestView,
    // },
    // {
    //   path: '/bible-view',
    //   name: 'bible-view',
    //   component: BibleView,
    // },
    // {
    //   path: '/books',
    //   name: 'Books',
    //   component: BooksList,
    // },
    // {
    //   path: '/book/:bookId',
    //   name: 'Chapters',
    //   component: ChaptersList,
    //   props: true,
    // },
    // {
    //   path: '/book/:bookId/chapter/:chapterId/version/:versionId',
    //   name: 'Verses',
    //   component: VersesList,
    //   props: true,
    // },
  ],
})
export default router

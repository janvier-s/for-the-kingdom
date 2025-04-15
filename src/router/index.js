import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TestamentView from '../views/TestamentView.vue'
import BookDetail from '../views/BookDetail.vue'
import supabase from '../supabase'

const getLanguageId = async (langName = 'Français') => {
  if (!getLanguageId.cache) {
    getLanguageId.cache = {}
  }
  if (getLanguageId.cache[langName]) {
    return getLanguageId.cache[langName]
  }

  try {
    const { data, error } = await supabase
      .from('languages')
      .select('lang_id')
      .eq('lang', langName)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Language '${langName}' not found.`)

    getLanguageId.cache[langName] = data.lang_id
    return data.lang_id
  } catch (err) {
    console.error(`Router Helper Error: Failed to get language ID for ${langName}`, err)
    throw new Error(`Language setup error: ${err.message}`)
  }
}

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
        console.log(`Route Guard: Finding testament ID for slug: ${slug}`)
        try {
          const langId = await getLanguageId('Français')

          const { data, error } = await supabase
            .from('testament_translations')
            .select('testament_id')
            .eq('slug', slug)
            .eq('lang_id', langId)
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              console.warn(
                `Route Guard: No testament translation found for slug: ${slug} and langId: ${langId}`,
              )
              return next(
                new Error(`Testament with slug '${slug}' not found for the selected language.`),
              )
            }
            throw error
          }

          if (data && data.testament_id) {
            console.log(`Route Guard: Found Testament ID: ${data.testament_id}`)
            to.params.testamentId = data.testament_id
            next()
          } else {
            console.warn(`Route Guard: No testament data/ID found for slug: ${slug}`)
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
      component: () => import('../components/TypeDetail.vue'),
      props: true,
    },
    {
      path: '/:testamentSlug/:typeSlug/:bookSlug',
      name: 'book-detail-by-slug',
      component: BookDetail,
      props: true,
    },
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('../views/NotFoundView.vue'),
    // },
  ],
})

export default router

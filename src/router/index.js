import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AncienTestamentView from '../views/AncienTestamentView.vue'
import TypeDetail from '../components/TypeDetail.vue'

import DataTestView from '../views/DataTestView.vue'
import BibleView from '../views/BibleView.vue'

import BooksList from '../views/BooksList.vue'
import ChaptersList from '../views/ChaptersList.vue'
import VersesList from '../views/VersesList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/ancien-testament',
      name: 'ancien-testament',
      component: AncienTestamentView,
    },
    {
      path: '/:typeName',
      name: 'type-detail',
      component: TypeDetail,
      props: true,
    },
    {
      path: '/supabase-test',
      name: 'supabase-test',
      component: DataTestView,
    },
    {
      path: '/bible-view',
      name: 'bible-view',
      component: BibleView,
    },
    {
      path: '/books',
      name: 'Books',
      component: BooksList,
    },
    {
      path: '/book/:bookId',
      name: 'Chapters',
      component: ChaptersList,
      props: true,
    },
    {
      path: '/book/:bookId/chapter/:chapterId/version/:versionId',
      name: 'Verses',
      component: VersesList,
      props: true,
    },
  ],
})
export default router

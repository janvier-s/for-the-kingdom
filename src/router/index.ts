// src/router/index.js (or index.ts)
import { createRouter, createWebHistory } from 'vue-router'
// Import your view components here.
// For now, let's assume your main content will be handled by components
// within MainContentArea.vue, but we can define a basic home route.
// You might create a specific view for Bible reading later.

// Example: If you had a dedicated view for Bible display
// import BibleView from '../views/BibleView.vue'
import MainContentArea from '../components/layout/MainContentArea.vue' // Or a dedicated Bible reading view

const routes = [
  {
    path: '/',
    name: 'Home',
    // component: BibleView // If you create a dedicated BibleView.vue
    // For now, we can point to MainContentArea if it's the primary content display
    // or have App.vue structure things and MainContentArea use <router-view />
    // Let's assume MainContentArea will use <router-view /> for now
    // and we define a child route or a default route for Bible content.
    redirect: '/bible', // Redirect to a default Bible path
  },
  {
    path: '/bible', // General path for Bible reading
    name: 'BibleBase',
    component: MainContentArea, // This component will render the verses/blocks
    // It might itself use <router-view> if you want nested routes
    // like /bible/GEN/1
    // You can add child routes here for specific books/chapters
    // children: [
    //   {
    //     path: ':bookOsis/:chapterNum',
    //     name: 'BibleChapter',
    //     component: MainContentArea, // Or a specific component to render chapter
    //     props: true // This will pass route params as props
    //   }
    // ]
  },
  // Add other routes for About, CCC, Commentary etc. later
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (About.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import('../views/AboutView.vue')
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // For history mode
  // history: createWebHashHistory(import.meta.env.BASE_URL), // For hash mode if needed
  routes,
})

export default router

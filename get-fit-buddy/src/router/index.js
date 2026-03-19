import { createRouter, createWebHistory } from 'vue-router'
import { useTrackerStore } from '../stores/tracker'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import AdminView from '../views/AdminView.vue'
import FriendsView from '../views/FriendsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/friends', name: 'friends', component: FriendsView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } }
  ]
})

router.beforeEach((to, from, next) => {
  const store = useTrackerStore()
  if (to.meta.requiresAuth && !store.currentUser) {
    next({ name: 'login' })
  } else if (to.meta.requiresAdmin && store.currentUser.role !== 'admin') {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router

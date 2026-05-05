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
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
  ],
})

router.beforeEach(async (to) => {
  const store = useTrackerStore()

  // Bootstrap on first navigation if a session marker exists but no currentUser loaded
  if (store.hasSession && !store.currentUser) {
    try {
      await store.bootstrap()
    } catch {
      await store.logout()
      return { name: 'login' }
    }
  }

  if (to.meta.requiresAuth && !store.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.requiresAdmin && !store.isAdmin) {
    return { name: 'dashboard' }
  }
})

export default router

<script setup>
import { useRouter } from 'vue-router'
import { useTrackerStore } from './stores/tracker'

const store = useTrackerStore()
const router = useRouter()

const handleLogout = () => {
  store.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div>
    <nav class="navbar is-dark" role="navigation" aria-label="main navigation" v-if="store.currentUser">
      <div class="navbar-brand">
        <strong class="navbar-item is-size-4">Get Fit Buddy</strong>
      </div>
      <div class="navbar-menu is-active">
        <div class="navbar-start">
          <router-link class="navbar-item" to="/dashboard">Dashboard</router-link>
          <router-link class="navbar-item" to="/friends">Friends</router-link>
          <router-link class="navbar-item" v-if="store.currentUser.role === 'admin'" to="/admin">Admin</router-link>
        </div>
        <div class="navbar-end">
          <div class="navbar-item">
            <button class="button is-light is-outlined" @click="handleLogout">
              Logout ({{ store.currentUser.name }})
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="section">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>
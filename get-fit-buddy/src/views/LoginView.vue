<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const router = useRouter()

const mode = ref('login') // 'login' or 'register'
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await store.login(email.value, password.value)
    await store.bootstrap()
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  error.value = ''
  loading.value = true
  try {
    await store.register(name.value, email.value, password.value)
    await store.bootstrap()
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = err.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}
</script>

<template>
  <div class="columns is-centered mt-6">
    <div class="column is-half">
      <div class="box has-text-centered shadow-lg">
        <h1 class="title is-spaced mb-4">Get Fit Buddy</h1>
        <p class="subtitle is-6 mb-5">{{ mode === 'login' ? 'Log In' : 'Register' }}</p>

        <div v-if="error" class="notification is-danger">
          <button class="delete"></button>
          {{ error }}
        </div>

        <div class="field">
          <label class="label has-text-left">Email</label>
          <div class="control">
            <input class="input" type="email" v-model="email" placeholder="your@email.com" />
          </div>
        </div>

        <div v-if="mode === 'register'" class="field">
          <label class="label has-text-left">Name</label>
          <div class="control">
            <input class="input" type="text" v-model="name" placeholder="Your Name" />
          </div>
        </div>

        <div class="field">
          <label class="label has-text-left">Password</label>
          <div class="control">
            <input class="input" type="password" v-model="password" placeholder="••••••" />
          </div>
        </div>

        <button
          class="button is-dark is-fullwidth is-medium mt-4"
          @click="mode === 'login' ? handleLogin() : handleRegister()"
          :loading="loading"
          :disabled="loading || !email || !password || (mode === 'register' && !name)"
        >
          {{ mode === 'login' ? 'Log In' : 'Register' }}
        </button>

        <p class="mt-4">
          {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
          <a @click="toggleMode" style="cursor: pointer; color: #3273dc">
            {{ mode === 'login' ? 'Register' : 'Log In' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
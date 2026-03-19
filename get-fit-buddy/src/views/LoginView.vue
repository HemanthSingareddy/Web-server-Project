<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const router = useRouter()
const selectedUserId = ref(null)

const handleLogin = () => {
  if (selectedUserId.value) {
    store.login(selectedUserId.value)
    router.push({ name: 'dashboard' })
  }
}
</script>

<template>
  <div class="columns is-centered mt-6">
    <div class="column is-half">
      <div class="box has-text-centered shadow-lg">
        <h1 class="title is-spaced mb-4">Get Fit Buddy</h1>
        <p class="subtitle is-6 mb-5">Select a user profile to test the app.</p>
        
        <div class="field">
          <div class="control">
            <div class="select is-fullwidth is-medium">
              <select v-model="selectedUserId">
                <option :value="null" disabled>Select User...</option>
                <option v-for="user in store.users" :key="user.id" :value="user.id">
                  {{ user.name }} (Role: {{ user.role }})
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <button class="button is-dark is-fullwidth is-medium mt-4" @click="handleLogin" :disabled="!selectedUserId">
          Log In
        </button>
      </div>
    </div>
  </div>
</template>
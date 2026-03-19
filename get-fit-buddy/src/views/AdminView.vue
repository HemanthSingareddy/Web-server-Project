<script setup>
import { ref } from 'vue'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const userForm = ref({ name: '', role: 'user' })
const editingUserId = ref(null)

const submitUser = () => {
  if (editingUserId.value) {
    const user = store.users.find(u => u.id === editingUserId.value)
    if (user) {
      user.name = userForm.value.name
      user.role = userForm.value.role
    }
    editingUserId.value = null
  } else {
    store.users.push({ id: Date.now(), name: userForm.value.name, role: userForm.value.role, friends: [] })
  }
  userForm.value = { name: '', role: 'user' }
}

const editUser = (user) => {
  userForm.value = { name: user.name, role: user.role }
  editingUserId.value = user.id
}

const deleteUser = (id) => {
  if (id === store.currentUser.id) return alert("You cannot delete your own admin account.")
  store.users = store.users.filter(u => u.id !== id)
  store.activities = store.activities.filter(a => a.userId !== id)
}
</script>

<template>
  <div>
    <h1 class="title">System Administration</h1>
    <div class="columns mt-4">
      <div class="column is-one-third">
        <div class="box">
          <h3 class="title is-5">{{ editingUserId ? 'Edit User' : 'Create User' }}</h3>
          <form @submit.prevent="submitUser">
            <div class="field">
              <label class="label">Name</label>
              <div class="control"><input class="input" v-model="userForm.name" type="text" required /></div>
            </div>
            <div class="field">
              <label class="label">Role</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="userForm.role">
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>
            <button class="button is-dark mt-2" type="submit">{{ editingUserId ? 'Update User' : 'Create User' }}</button>
          </form>
        </div>
      </div>
      
      <div class="column is-two-thirds">
        <div class="box">
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr><th>User ID</th><th>Name</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="user in store.users" :key="user.id">
                <td>{{ user.id }}</td>
                <td><strong>{{ user.name }}</strong></td>
                <td>
                  <span class="tag" :class="user.role === 'admin' ? 'is-danger is-light' : 'is-info is-light'">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <button class="button is-small is-info is-light mr-2" @click="editUser(user)">Edit</button>
                  <button class="button is-small is-danger is-light" @click="deleteUser(user.id)" :disabled="user.id === store.currentUser.id">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
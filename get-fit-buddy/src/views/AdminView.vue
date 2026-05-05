<script setup>
import { ref, onMounted } from 'vue'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const userForm = ref({ name: '', email: '', role: 'user' })
const typeForm = ref({ name: '', description: '' })
const editingUserId = ref(null)
const editingTypeId = ref(null)
const error = ref('')
const loading = ref(false)
const tab = ref('users') // 'users' or 'types'

onMounted(async () => {
  try {
    await store.fetchUsers()
    await store.fetchExerciseTypes()
  } catch (err) {
    error.value = 'Failed to load data'
  }
})

const submitUser = async () => {
  error.value = ''
  if (!userForm.value.name || !userForm.value.email) {
    error.value = 'Name and email are required'
    return
  }

  loading.value = true
  try {
    if (editingUserId.value) {
      await store.updateUser(editingUserId.value, userForm.value.name, userForm.value.role)
    } else {
      await store.createUser(userForm.value.name, userForm.value.email, userForm.value.role)
    }
    userForm.value = { name: '', email: '', role: 'user' }
    editingUserId.value = null
  } catch (err) {
    error.value = err.message || 'Failed to save user'
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  userForm.value = { name: user.name, email: user.email, role: user.role }
  editingUserId.value = user.id
}

const deleteUser = async (id) => {
  if (id === store.currentUser.id) {
    error.value = 'You cannot delete your own admin account'
    return
  }
  if (!confirm('Are you sure?')) return
  try {
    await store.deleteUser(id)
  } catch (err) {
    error.value = 'Failed to delete user'
  }
}

const cancelEditUser = () => {
  userForm.value = { name: '', email: '', role: 'user' }
  editingUserId.value = null
}

const submitType = async () => {
  error.value = ''
  if (!typeForm.value.name) {
    error.value = 'Name is required'
    return
  }

  loading.value = true
  try {
    if (editingTypeId.value) {
      await store.updateExerciseType(editingTypeId.value, typeForm.value.name, typeForm.value.description)
    } else {
      await store.createExerciseType(typeForm.value.name, typeForm.value.description)
    }
    typeForm.value = { name: '', description: '' }
    editingTypeId.value = null
  } catch (err) {
    error.value = err.message || 'Failed to save exercise type'
  } finally {
    loading.value = false
  }
}

const editType = (type) => {
  typeForm.value = { name: type.name, description: type.description }
  editingTypeId.value = type.id
}

const deleteType = async (id) => {
  if (!confirm('Are you sure?')) return
  try {
    await store.deleteExerciseType(id)
  } catch (err) {
    error.value = err.message || 'Failed to delete exercise type'
  }
}

const cancelEditType = () => {
  typeForm.value = { name: '', description: '' }
  editingTypeId.value = null
}
</script>

<template>
  <div>
    <h1 class="title">System Administration</h1>
    
    <div v-if="error" class="notification is-danger mb-4">
      {{ error }}
    </div>

    <div class="tabs is-boxed mb-4">
      <ul>
        <li :class="tab === 'users' && 'is-active'">
          <a @click="tab = 'users'">Users</a>
        </li>
        <li :class="tab === 'types' && 'is-active'">
          <a @click="tab = 'types'">Exercise Types</a>
        </li>
      </ul>
    </div>

    <!-- Users Tab -->
    <div v-if="tab === 'users'" class="columns">
      <div class="column is-one-third">
        <div class="box">
          <h3 class="title is-5">{{ editingUserId ? 'Edit User' : 'Create User' }}</h3>
          <form @submit.prevent="submitUser">
            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input class="input" v-model="userForm.name" type="text" required />
              </div>
            </div>
            <div class="field">
              <label class="label">Email</label>
              <div class="control">
                <input class="input" v-model="userForm.email" type="email" :disabled="!!editingUserId" required />
              </div>
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
            <div class="control mt-4">
              <button class="button is-dark" type="submit" :loading="loading" :disabled="loading">
                {{ editingUserId ? 'Update' : 'Create' }}
              </button>
              <button
                class="button is-light ml-2"
                type="button"
                v-if="editingUserId"
                @click="cancelEditUser"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="column is-two-thirds">
        <div class="box">
          <h3 class="title is-5">Users</h3>
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in store.users" :key="user.id">
                <td><strong>{{ user.name }}</strong></td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="tag" :class="user.role === 'admin' ? 'is-danger is-light' : 'is-info is-light'">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <button class="button is-small is-info is-light mr-2" @click="editUser(user)">Edit</button>
                  <button
                    class="button is-small is-danger is-light"
                    @click="deleteUser(user.id)"
                    :disabled="user.id === store.currentUser?.id"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Types Tab -->
    <div v-if="tab === 'types'" class="columns">
      <div class="column is-one-third">
        <div class="box">
          <h3 class="title is-5">{{ editingTypeId ? 'Edit Type' : 'Create Type' }}</h3>
          <form @submit.prevent="submitType">
            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input class="input" v-model="typeForm.name" type="text" required />
              </div>
            </div>
            <div class="field">
              <label class="label">Description</label>
              <div class="control">
                <textarea class="textarea" v-model="typeForm.description" placeholder="(optional)"></textarea>
              </div>
            </div>
            <div class="control mt-4">
              <button class="button is-dark" type="submit" :loading="loading" :disabled="loading">
                {{ editingTypeId ? 'Update' : 'Create' }}
              </button>
              <button
                class="button is-light ml-2"
                type="button"
                v-if="editingTypeId"
                @click="cancelEditType"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="column is-two-thirds">
        <div class="box">
          <h3 class="title is-5">Exercise Types</h3>
          <table class="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="type in store.exerciseTypes" :key="type.id">
                <td><strong>{{ type.name }}</strong></td>
                <td>{{ type.description }}</td>
                <td>
                  <button class="button is-small is-info is-light mr-2" @click="editType(type)">Edit</button>
                  <button class="button is-small is-danger is-light" @click="deleteType(type.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
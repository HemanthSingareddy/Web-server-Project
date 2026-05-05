<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const activityForm = ref({ date: '', exerciseTypeId: '', durationMinutes: '', notes: '' })
const editingId = ref(null)
const error = ref('')
const loading = ref(false)
const summary = ref(null)
const streak = ref(0)

onMounted(async () => {
  try {
    await store.fetchExerciseTypes()
    await store.fetchActivities()
    
    // Fetch weekly summary for the current week
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startDate = startOfWeek.toISOString().split('T')[0]
    await store.fetchWeeklySummary(startDate)
    summary.value = store.summary
    
    // Fetch current streak
    await store.fetchStreak()
    streak.value = store.streak
  } catch (err) {
    error.value = 'Failed to load data'
  }
})

const getExerciseTypeName = (typeId) => {
  const type = store.exerciseTypes.find(t => t.id === typeId)
  return type?.name || 'Unknown'
}

const submitActivity = async () => {
  error.value = ''
  if (!activityForm.value.date || !activityForm.value.exerciseTypeId || !activityForm.value.durationMinutes) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  try {
    const duration = parseInt(activityForm.value.durationMinutes)
    if (duration <= 0) {
      error.value = 'Duration must be positive'
      loading.value = false
      return
    }

    if (editingId.value) {
      await store.updateActivity(
        editingId.value,
        activityForm.value.date,
        activityForm.value.exerciseTypeId,
        duration,
        activityForm.value.notes
      )
    } else {
      await store.createActivity(
        activityForm.value.date,
        activityForm.value.exerciseTypeId,
        duration,
        activityForm.value.notes
      )
    }
    
    activityForm.value = { date: '', exerciseTypeId: '', durationMinutes: '', notes: '' }
    editingId.value = null
    
    // Refresh summary and streak
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startDate = startOfWeek.toISOString().split('T')[0]
    await store.fetchWeeklySummary(startDate)
    summary.value = store.summary
    await store.fetchStreak()
    streak.value = store.streak
  } catch (err) {
    error.value = err.message || 'Failed to save activity'
  } finally {
    loading.value = false
  }
}

const editActivity = (activity) => {
  activityForm.value = {
    date: activity.date,
    exerciseTypeId: activity.exerciseTypeId,
    durationMinutes: String(activity.durationMinutes),
    notes: activity.notes || ''
  }
  editingId.value = activity.id
}

const deleteActivity = async (id) => {
  if (!confirm('Are you sure?')) return
  try {
    await store.deleteActivity(id)
  } catch (err) {
    error.value = 'Failed to delete activity'
  }
}

const cancelEdit = () => {
  activityForm.value = { date: '', exerciseTypeId: '', durationMinutes: '', notes: '' }
  editingId.value = null
}

const myActivities = computed(() => store.activities)
</script>

<template>
  <div>
    <h1 class="title">Welcome, {{ store.currentUser?.name }}</h1>

    <div v-if="error" class="notification is-danger mb-4">
      {{ error }}
    </div>

    <div class="columns mb-5">
      <div class="column is-one-third">
        <div class="box has-background-info-light has-text-centered">
          <h3 class="title is-6 has-text-dark">Weekly Workouts</h3>
          <p class="title is-2 has-text-dark">{{ summary?.total_workouts || 0 }}</p>
        </div>
      </div>
      <div class="column is-one-third">
        <div class="box has-background-success-light has-text-centered">
          <h3 class="title is-6 has-text-dark">Weekly Minutes</h3>
          <p class="title is-2 has-text-dark">{{ summary?.total_minutes || 0 }}</p>
        </div>
      </div>
      <div class="column is-one-third">
        <div class="box has-background-warning-light has-text-centered">
          <h3 class="title is-6 has-text-dark">Current Streak</h3>
          <p class="title is-2 has-text-dark">{{ streak }} <span class="is-size-5">days</span></p>
        </div>
      </div>
    </div>

    <div class="columns">
      <div class="column is-one-third">
        <div class="box">
          <h3 class="title is-5">{{ editingId ? 'Edit Workout' : 'Log New Workout' }}</h3>
          <form @submit.prevent="submitActivity">
            <div class="field">
              <label class="label">Date</label>
              <div class="control">
                <input class="input" v-model="activityForm.date" type="date" required />
              </div>
            </div>
            <div class="field">
              <label class="label">Exercise Type</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="activityForm.exerciseTypeId" required>
                    <option value="">Select type...</option>
                    <option v-for="type in store.exerciseTypes" :key="type.id" :value="type.id">
                      {{ type.name }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label class="label">Duration (min)</label>
              <div class="control">
                <input class="input" v-model="activityForm.durationMinutes" type="number" min="1" required />
              </div>
            </div>
            <div class="field">
              <label class="label">Notes</label>
              <div class="control">
                <textarea class="textarea" v-model="activityForm.notes" placeholder="PRs, exercises, sets..."></textarea>
              </div>
            </div>
            <div class="control mt-4">
              <button class="button is-dark" type="submit" :loading="loading" :disabled="loading">
                {{ editingId ? 'Update' : 'Save' }}
              </button>
              <button class="button is-light ml-2" type="button" v-if="editingId" @click="cancelEdit">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div class="column is-two-thirds">
        <div class="box">
          <h3 class="title is-5">Activity History</h3>
          <div v-if="myActivities.length === 0" class="notification is-light">
            No workouts logged yet. Time to hit the gym!
          </div>

          <table v-else class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Exercise</th>
                <th>Duration</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in myActivities" :key="activity.id">
                <td>{{ activity.date }}</td>
                <td><strong>{{ activity.exerciseTypeName }}</strong></td>
                <td>{{ activity.durationMinutes }}m</td>
                <td><span class="is-size-7">{{ activity.notes }}</span></td>
                <td>
                  <div class="buttons">
                    <button class="button is-small is-info is-light" @click="editActivity(activity)">Edit</button>
                    <button class="button is-small is-danger is-light" @click="deleteActivity(activity.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
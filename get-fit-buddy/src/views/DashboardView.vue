<script setup>
import { ref } from 'vue'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const activityForm = ref({ type: '', date: '', duration: '', notes: '' })
const editingId = ref(null)

const submitActivity = () => {
  if (editingId.value) {
    const index = store.activities.findIndex(a => a.id === editingId.value)
    if (index !== -1) {
      store.activities[index] = { ...activityForm.value, id: editingId.value, userId: store.currentUser.id }
    }
    editingId.value = null
  } else {
    store.addActivity({ ...activityForm.value })
  }
  activityForm.value = { type: '', date: '', duration: '', notes: '' }
}

const editActivity = (activity) => {
  activityForm.value = { ...activity }
  editingId.value = activity.id
}

const cancelEdit = () => {
  activityForm.value = { type: '', date: '', duration: '', notes: '' }
  editingId.value = null
}
</script>

<template>
  <div>
    <h1 class="title">Welcome, {{ store.currentUser.name }}</h1>

    <div class="columns mb-5 text-center">
      <div class="column is-one-third">
        <div class="box has-background-info-light has-text-centered">
          <h3 class="title is-6 has-text-dark">Total Workouts</h3>
          <p class="title is-2 has-text-dark">{{ store.myStats.totalWorkouts }}</p>
        </div>
      </div>
      <div class="column is-one-third">
        <div class="box has-background-success-light has-text-centered">
          <h3 class="title is-6 has-text-dark">Total Minutes</h3>
          <p class="title is-2 has-text-dark">{{ store.myStats.totalMinutes }}</p>
        </div>
      </div>
      <div class="column is-one-third">
        <div class="box has-background-warning-light has-text-centered">
          <h3 class="title is-6 has-text-dark">Avg Duration</h3>
          <p class="title is-2 has-text-dark">{{ store.myStats.avgDuration }} <span class="is-size-5">min</span></p>
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
              <div class="control"><input class="input" v-model="activityForm.date" type="date" required /></div>
            </div>
            <div class="field">
              <label class="label">Workout Type</label>
              <div class="control"><input class="input" v-model="activityForm.type" type="text" placeholder="e.g., Heavy Leg Day" required /></div>
            </div>
            <div class="field">
              <label class="label">Duration (min)</label>
              <div class="control"><input class="input" v-model.number="activityForm.duration" type="number" required /></div>
            </div>
            <div class="field">
              <label class="label">Notes</label>
              <div class="control"><textarea class="textarea" v-model="activityForm.notes" placeholder="PRs, exercises, sets..."></textarea></div>
            </div>
            <div class="control mt-4">
              <button class="button is-dark" type="submit">{{ editingId ? 'Update Workout' : 'Save Workout' }}</button>
              <button class="button is-light ml-2" type="button" v-if="editingId" @click="cancelEdit">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div class="column is-two-thirds">
        <div class="box">
          <h3 class="title is-5">Activity History</h3>
          <div v-if="store.myActivities.length === 0" class="notification is-light">No workouts logged yet. Time to hit the gym!</div>
          
          <table v-else class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Focus</th>
                <th>Time</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in store.myActivities" :key="activity.id">
                <td>{{ activity.date }}</td>
                <td><strong>{{ activity.type }}</strong></td>
                <td>{{ activity.duration }}m</td>
                <td><span class="is-size-7">{{ activity.notes }}</span></td>
                <td>
                  <div class="buttons">
                    <button class="button is-small is-info is-light" @click="editActivity(activity)">Edit</button>
                    <button class="button is-small is-danger is-light" @click="store.deleteActivity(activity.id)">Delete</button>
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
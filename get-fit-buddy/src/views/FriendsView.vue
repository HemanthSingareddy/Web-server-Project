<script setup>
import { ref, onMounted } from 'vue'
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()
const error = ref('')
const loading = ref(false)
const people = ref([])
const selectedPersonId = ref(null)
const tab = ref('feed') // 'feed' or 'add'

onMounted(async () => {
  try {
    await store.fetchFriends()
    await store.fetchFriendFeed()
  } catch (err) {
    error.value = 'Failed to load friends data'
  }
})

const loadPeopleList = async () => {
  if (people.value.length > 0) return
  try {
    people.value = await store.fetchPeople()
  } catch (err) {
    error.value = 'Failed to load people list'
  }
}

const addFriend = async () => {
  error.value = ''
  if (!selectedPersonId.value) {
    error.value = 'Please select a person'
    return
  }

  loading.value = true
  try {
    await store.addFriend(selectedPersonId.value)
    selectedPersonId.value = null
    people.value = []
    await loadPeopleList()
    await store.fetchFriendFeed()
  } catch (err) {
    error.value = err.message || 'Failed to add friend'
  } finally {
    loading.value = false
  }
}

const removeFriend = async (friendUserId) => {
  if (!confirm('Remove this friend?')) return
  try {
    await store.removeFriend(friendUserId)
    await store.fetchFriendFeed()
  } catch (err) {
    error.value = 'Failed to remove friend'
  }
}
</script>

<template>
  <div>
    <h1 class="title">Friends</h1>

    <div v-if="error" class="notification is-danger mb-4">
      {{ error }}
    </div>

    <div class="tabs is-boxed mb-4">
      <ul>
        <li :class="tab === 'feed' && 'is-active'">
          <a @click="tab = 'feed'">Feed</a>
        </li>
        <li :class="tab === 'add' && 'is-active'">
          <a @click="tab = 'add'; loadPeopleList()">Add Friends</a>
        </li>
      </ul>
    </div>

    <!-- Feed Tab -->
    <div v-if="tab === 'feed'">
      <div class="box mb-4">
        <h3 class="title is-5">Your Friends ({{ store.friends.length }})</h3>
        <div v-if="store.friends.length === 0" class="notification is-light">
          No friends yet. Start adding people!
        </div>
        <div v-else class="tags">
          <span v-for="friend in store.friends" :key="friend.id" class="tag is-info is-light">
            {{ friend.name }}
            <button
              class="delete is-small"
              @click="removeFriend(friend.friendUserId)"
              type="button"
            ></button>
          </span>
        </div>
      </div>

      <div class="box">
        <h3 class="title is-5">Friend Feed</h3>
        <div v-if="store.feed.length === 0" class="notification is-light">
          Your friends haven't logged any workouts recently.
        </div>

        <article v-for="activity in store.feed" :key="activity.id" class="box">
          <div class="media">
            <div class="media-content">
              <div class="content">
                <p>
                  <strong class="is-size-5">{{ activity.userName }}</strong>
                  <span class="has-text-grey"> completed a </span>
                  <strong class="has-text-info">{{ activity.exerciseTypeName }}</strong>
                  <span class="has-text-grey"> workout.</span>
                  <br />
                  <small class="has-text-grey-light">
                    {{ activity.date }} • {{ activity.durationMinutes }} minutes
                  </small>
                  <br />
                  <span v-if="activity.notes" class="is-italic mt-2 is-inline-block"
                    >"{{ activity.notes }}"</span
                  >
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Add Friends Tab -->
    <div v-if="tab === 'add'" class="columns">
      <div class="column is-one-third">
        <div class="box">
          <h3 class="title is-5">Add a Friend</h3>
          <div class="field">
            <label class="label">Select Person</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="selectedPersonId">
                  <option :value="null">Select person...</option>
                  <option
                    v-for="person in people"
                    :key="person.id"
                    :value="person.id"
                    :disabled="store.friends.some(f => f.friendUserId === person.id)"
                  >
                    {{ person.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <button
            class="button is-dark is-fullwidth mt-4"
            @click="addFriend"
            :loading="loading"
            :disabled="loading || !selectedPersonId"
          >
            Add Friend
          </button>
        </div>
      </div>

      <div class="column is-two-thirds">
        <div class="box">
          <h3 class="title is-5">Current Friends</h3>
          <div v-if="store.friends.length === 0" class="notification is-light">
            No friends added yet.
          </div>
          <table v-else class="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="friend in store.friends" :key="friend.id">
                <td>{{ friend.name }}</td>
                <td>
                  <button
                    class="button is-small is-danger is-light"
                    @click="removeFriend(friend.friendUserId)"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
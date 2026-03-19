<script setup>
import { useTrackerStore } from '../stores/tracker'

const store = useTrackerStore()

const getFriendName = (userId) => {
  const friend = store.users.find(u => u.id === userId)
  return friend ? friend.name : 'Unknown Gym Buddy'
}
</script>

<template>
  <div>
    <h1 class="title is-spaced mb-4">Friends Feed</h1>
    <p class="subtitle is-6 mb-5">Check out what your crew is lifting.</p>

    <div class="box has-background-light" v-if="store.friendsActivities.length === 0">
      <p>Your friends haven't logged any workouts recently.</p>
    </div>
    
    <div class="box mb-4" v-for="activity in store.friendsActivities" :key="activity.id">
      <article class="media">
        <div class="media-content">
          <div class="content">
            <p>
              <strong class="is-size-5">{{ getFriendName(activity.userId) }}</strong> 
              <span class="has-text-grey"> completed a </span>
              <strong class="has-text-info">{{ activity.type }}</strong> workout.
              <br>
              <small class="has-text-grey-light">{{ activity.date }} • {{ activity.duration }} minutes</small>
              <br>
              <span v-if="activity.notes" class="is-italic mt-2 is-inline-block">"{{ activity.notes }}"</span>
            </p>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
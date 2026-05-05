import { defineStore } from 'pinia'
import { apiRequest } from '../services/apiClient'

export const useTrackerStore = defineStore('tracker', {
  state: () => ({
    currentUser: null,
    token: localStorage.getItem('token') || null,
    users: [],
    exerciseTypes: [],
    activities: [],
    friends: [],
    feed: [],
    summary: null,
    streak: 0,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.currentUser && state.token),
    isAdmin: (state) => state.currentUser?.role === 'admin',
  },

  actions: {
    async bootstrap() {
      if (!this.isAuthenticated) return
      try {
        await Promise.all([
          this.fetchMe(),
          this.fetchExerciseTypes(),
          this.fetchActivities(),
          this.fetchFriends(),
          this.fetchFriendFeed(),
        ])
      } catch {
        // Silent catch - let individual endpoints handle errors
      }
    },

    async register(name, email, password) {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      })
      this.currentUser = data.user
      this.token = data.token
      localStorage.setItem('token', data.token)
      return data
    },

    async login(email, password) {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      this.currentUser = data.user
      this.token = data.token
      localStorage.setItem('token', data.token)
      return data
    },

    async fetchMe() {
      const data = await apiRequest('/auth/me', { token: this.token })
      this.currentUser = data.user
      return data
    },

    logout() {
      this.currentUser = null
      this.token = null
      this.users = []
      this.exerciseTypes = []
      this.activities = []
      this.friends = []
      this.feed = []
      localStorage.removeItem('token')
    },

    // Exercise Types
    async fetchExerciseTypes() {
      const data = await apiRequest('/exercise-types')
      this.exerciseTypes = data.types || []
      return data
    },

    async createExerciseType(name, description) {
      const data = await apiRequest('/exercise-types', {
        method: 'POST',
        token: this.token,
        body: { name, description },
      })
      this.exerciseTypes.push(data.type)
      return data
    },

    async updateExerciseType(id, name, description) {
      const data = await apiRequest(`/exercise-types/${id}`, {
        method: 'PUT',
        token: this.token,
        body: { name, description },
      })
      const idx = this.exerciseTypes.findIndex((t) => t.id === id)
      if (idx >= 0) {
        this.exerciseTypes[idx] = data.type
      }
      return data
    },

    async deleteExerciseType(id) {
      await apiRequest(`/exercise-types/${id}`, {
        method: 'DELETE',
        token: this.token,
      })
      this.exerciseTypes = this.exerciseTypes.filter((t) => t.id !== id)
    },

    // Activities
    async fetchActivities() {
      const data = await apiRequest('/activities', { token: this.token })
      this.activities = data.activities || []
      return data
    },

    async createActivity(date, exerciseTypeId, durationMinutes, notes) {
      const data = await apiRequest('/activities', {
        method: 'POST',
        token: this.token,
        body: { date, exerciseTypeId, durationMinutes, notes },
      })
      this.activities.push(data.activity)
      return data
    },

    async updateActivity(id, date, exerciseTypeId, durationMinutes, notes) {
      const data = await apiRequest(`/activities/${id}`, {
        method: 'PUT',
        token: this.token,
        body: { date, exerciseTypeId, durationMinutes, notes },
      })
      const idx = this.activities.findIndex((a) => a.id === id)
      if (idx >= 0) {
        this.activities[idx] = data.activity
      }
      return data
    },

    async deleteActivity(id) {
      await apiRequest(`/activities/${id}`, {
        method: 'DELETE',
        token: this.token,
      })
      this.activities = this.activities.filter((a) => a.id !== id)
    },

    // Weekly summary
    async fetchWeeklySummary(startDate) {
      const data = await apiRequest(`/activities/summary/weekly?start=${startDate}`, {
        token: this.token,
      })
      this.summary = data.summary
      return data
    },

    // Streak
    async fetchStreak() {
      const data = await apiRequest('/activities/streak', { token: this.token })
      this.streak = data.streak
      return data
    },

    // Friends
    async fetchFriends() {
      const data = await apiRequest('/friends', { token: this.token })
      this.friends = data.friends || []
      return data
    },

    async addFriend(friendUserId) {
      const data = await apiRequest('/friends', {
        method: 'POST',
        token: this.token,
        body: { friendUserId },
      })
      if (!this.friends.find((f) => f.id === data.friend.friendUserId)) {
        this.friends.push(data.friend)
      }
      return data
    },

    async removeFriend(friendUserId) {
      await apiRequest('/friends', {
        method: 'DELETE',
        token: this.token,
        body: { friendUserId },
      })
      this.friends = this.friends.filter((f) => f.friendUserId !== friendUserId)
    },

    // Feed
    async fetchFriendFeed() {
      const data = await apiRequest('/activities/feed/friends', { token: this.token })
      this.feed = data.feed || []
      return data
    },

    // Users (admin)
    async fetchUsers() {
      const data = await apiRequest('/users', { token: this.token })
      this.users = data.users || []
      return data
    },

    async createUser(name, email, role) {
      const data = await apiRequest('/users', {
        method: 'POST',
        token: this.token,
        body: { name, email, role },
      })
      this.users.push(data.user)
      return data
    },

    async updateUser(id, name, role) {
      const data = await apiRequest(`/users/${id}`, {
        method: 'PUT',
        token: this.token,
        body: { name, role },
      })
      const idx = this.users.findIndex((u) => u.id === id)
      if (idx >= 0) {
        this.users[idx] = data.user
      }
      return data
    },

    async deleteUser(id) {
      await apiRequest(`/users/${id}`, {
        method: 'DELETE',
        token: this.token,
      })
      this.users = this.users.filter((u) => u.id !== id)
    },

    // People list (for friend adding)
    async fetchPeople() {
      const data = await apiRequest('/users/people', { token: this.token })
      return data.people || []
    },
  },
})
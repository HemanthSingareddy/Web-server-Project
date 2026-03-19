import { defineStore } from 'pinia'

export const useTrackerStore = defineStore('tracker', {
  state: () => ({
    currentUser: null,
    users: [
      { id: 1, name: 'Admin User', role: 'admin', friends: [3] },
      { id: 2, name: 'Nitin', role: 'user', friends: [3] },
      { id: 3, name: 'GymBuddy', role: 'user', friends: [2] }
    ],
    activities: [
      { id: 101, userId: 2, date: '2026-03-10', type: 'Upper Body Power', duration: 75, notes: 'Heavy bench and rows for mass.' },
      { id: 102, userId: 2, date: '2026-03-11', type: 'Lower Body Power', duration: 80, notes: 'Squats. Legs are fried.' },
      { id: 103, userId: 2, date: '2026-03-12', type: 'Push (Hypertrophy)', duration: 60, notes: 'High volume chest/shoulders/triceps.' },
      { id: 104, userId: 2, date: '2026-03-13', type: 'Pull (Hypertrophy)', duration: 65, notes: 'Focused on lat spread and bicep peaks.' },
      { id: 105, userId: 2, date: '2026-03-14', type: 'Legs (Hypertrophy)', duration: 70, notes: 'Leg press and hamstring curls.' },
      { id: 106, userId: 3, date: '2026-03-13', type: 'Cardio', duration: 30, notes: 'Stairmaster.' }
    ]
  }),
  getters: {
    myActivities: (state) => state.activities.filter(a => a.userId === state.currentUser?.id),
    friendsActivities: (state) => {
      if (!state.currentUser) return []
      return state.activities.filter(a => state.currentUser.friends.includes(a.userId))
    },
    myStats: (state) => {
      const mine = state.activities.filter(a => a.userId === state.currentUser?.id)
      const totalWorkouts = mine.length
      const totalMinutes = mine.reduce((sum, a) => sum + a.duration, 0)
      const avgDuration = totalWorkouts ? Math.round(totalMinutes / totalWorkouts) : 0
      return { totalWorkouts, totalMinutes, avgDuration }
    }
  },
  actions: {
    login(userId) { this.currentUser = this.users.find(u => u.id === userId) },
    logout() { this.currentUser = null },
    addActivity(activity) { this.activities.push({ ...activity, id: Date.now(), userId: this.currentUser.id }) },
    deleteActivity(activityId) { this.activities = this.activities.filter(a => a.id !== activityId) }
  }
})
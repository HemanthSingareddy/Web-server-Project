import { defineStore } from 'pinia'
import { loginUser, registerUser, getCurrentUser, signOut } from '../services/supabaseAuth'
import { supabase } from '../services/supabaseClient'

// Key used only to indicate that a session exists, never stores the actual token
const SESSION_MARKER_KEY = 'hasSession'

export const useTrackerStore = defineStore('tracker', {
  state: () => ({
    currentUser: null,
    // Token is held in memory only; Supabase manages session persistence internally
    token: null,
    hasSession: !!localStorage.getItem(SESSION_MARKER_KEY),
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
    isAdmin: (state) => state.currentUser?.email === 'hemanth1@gmail.com',
  },

  actions: {
    async bootstrap() {
      if (!this.hasSession) return
      try {
        await this.fetchMe()
        await Promise.all([
          this.fetchExerciseTypes(),
          this.fetchActivities(),
          this.fetchFriends(),
          this.fetchFriendFeed(),
        ])
        await this.fetchWeeklySummary(new Date().toISOString().split('T')[0])
        await this.fetchStreak()
      } catch {
        // Silent catch - let individual endpoints handle errors
      }
    },

    async register(name, email, password) {
      const data = await registerUser(name, email, password)
      this.currentUser = data.user
      this.token = data.token
      if (data.token) {
        this.hasSession = true
        localStorage.setItem(SESSION_MARKER_KEY, '1')
      }
      return data
    },

    async login(email, password) {
      const data = await loginUser(email, password)
      this.currentUser = data.user
      this.token = data.token
      if (data.token) {
        this.hasSession = true
        localStorage.setItem(SESSION_MARKER_KEY, '1')
      }
      return data
    },

    async fetchMe() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session) {
        this.token = sessionData.session.access_token
      }
      const user = await getCurrentUser()
      if (user) this.currentUser = user
      return { user }
    },

    async logout() {
      await signOut()
      this.currentUser = null
      this.token = null
      this.hasSession = false
      this.users = []
      this.exerciseTypes = []
      this.activities = []
      this.friends = []
      this.feed = []
      this.summary = null
      this.streak = 0
      localStorage.removeItem(SESSION_MARKER_KEY)
    },

    // Exercise Types
    async fetchExerciseTypes() {
      const { data: types, error } = await supabase.from('exercise_types').select('*')
      if (error) throw new Error(error.message)
      this.exerciseTypes = types || []
      return { types }
    },

    async createExerciseType(name, description) {
      const { data: type, error } = await supabase
        .from('exercise_types')
        .insert({ name, description })
        .select()
        .single()

      if (error) throw new Error(error.message)
      this.exerciseTypes.push(type)
      return { type }
    },

    async updateExerciseType(id, name, description) {
      const { data: type, error } = await supabase
        .from('exercise_types')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      const idx = this.exerciseTypes.findIndex((t) => t.id === id)
      if (idx >= 0) this.exerciseTypes[idx] = type
      return { type }
    },

    async deleteExerciseType(id) {
      const { error } = await supabase.from('exercise_types').delete().eq('id', id)
      if (error) throw new Error(error.message)
      this.exerciseTypes = this.exerciseTypes.filter((t) => t.id !== id)
    },

    // Activities
    async fetchActivities() {
      if (!this.currentUser?.id) return { activities: [] }
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', this.currentUser.id)

      if (error) throw new Error(error.message)
      this.activities = activities || []
      return { activities }
    },

    async createActivity(date, exerciseTypeId, durationMinutes, notes) {
      const { data: activity, error } = await supabase
        .from('activities')
        .insert({
          date,
          exercise_type_id: exerciseTypeId,
          duration_minutes: Number(durationMinutes),
          notes,
          user_id: this.currentUser?.id,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      this.activities.push(activity)

      await this.fetchWeeklySummary(date)
      await this.fetchStreak()

      return { activity }
    },

    async updateActivity(id, date, exerciseTypeId, durationMinutes, notes) {
      const { data: activity, error } = await supabase
        .from('activities')
        .update({
          date,
          exercise_type_id: exerciseTypeId,
          duration_minutes: Number(durationMinutes),
          notes,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      const idx = this.activities.findIndex((a) => a.id === id)
      if (idx >= 0) this.activities[idx] = activity

      await this.fetchWeeklySummary(date)
      await this.fetchStreak()

      return { activity }
    },

    async deleteActivity(id) {
      const { error } = await supabase.from('activities').delete().eq('id', id)
      if (error) throw new Error(error.message)
      this.activities = this.activities.filter((a) => a.id !== id)

      await this.fetchWeeklySummary(new Date().toISOString().split('T')[0])
      await this.fetchStreak()
    },

    // Weekly summary
    async fetchWeeklySummary(startDate) {
      if (!this.currentUser?.id) return { summary: [] }
      const start = new Date(startDate)
      if (isNaN(start.getTime())) throw new Error('Invalid startDate provided')
      const end = new Date(start)
      end.setDate(end.getDate() + 7)

      const { data: activities, error } = await supabase
        .from('activities')
        .select('*, exercise_types(name)')
        .eq('user_id', this.currentUser.id)
        .gte('date', start.toISOString().split('T')[0])
        .lt('date', end.toISOString().split('T')[0])

      if (error) throw new Error(error.message)
      const summary = activities || []
      this.summary = summary
      return { summary }
    },

    // Streak
    async fetchStreak() {
      if (!this.currentUser?.id) return { streak: 0 }
      const { data: activities, error } = await supabase
        .from('activities')
        .select('date')
        .eq('user_id', this.currentUser.id)
        .order('date', { ascending: false })

      if (error) throw new Error(error.message)

      const uniqueDates = [...new Set((activities || []).map((a) => a.date))].sort().reverse()
      let streak = 0
      const today = new Date().toISOString().split('T')[0]
      let expected = today

      for (const date of uniqueDates) {
        if (date === expected) {
          streak++
          const d = new Date(expected)
          d.setDate(d.getDate() - 1)
          expected = d.toISOString().split('T')[0]
        } else {
          break
        }
      }

      this.streak = streak
      return { streak }
    },

    // Friends
    async fetchFriends() {
      if (!this.currentUser?.id) return { friends: [] }
      const { data: friends, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', this.currentUser.id)

      if (error) throw new Error(error.message)
      this.friends = friends || []
      return { friends }
    },

    async addFriend(friendUserId) {
      const { data: friend, error } = await supabase
        .from('friends')
        .insert({ user_id: this.currentUser?.id, friend_id: friendUserId })
        .select()
        .single()

      if (error) throw new Error(error.message)
      if (!this.friends.find((f) => f.friend_id === friendUserId)) {
        this.friends.push(friend)
      }
      return { friend }
    },

    async removeFriend(friendUserId) {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', this.currentUser?.id)
        .eq('friend_id', friendUserId)

      if (error) throw new Error(error.message)
      this.friends = this.friends.filter((f) => f.friend_id !== friendUserId)
    },

    // Feed
    async fetchFriendFeed() {
      if (!this.currentUser?.id) return { feed: [] }
      const friendIds = this.friends.map((f) => f.friend_id)
      if (friendIds.length === 0) {
        this.feed = []
        return { feed: [] }
      }

      const { data: feed, error } = await supabase
        .from('activities')
        .select('*, exercise_types(name)')
        .in('user_id', friendIds)
        .order('date', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)
      this.feed = feed || []
      return { feed }
    },

    // Users (admin)
    async fetchUsers() {
      const { data: users, error } = await supabase.from('profiles').select('*')
      if (error) throw new Error(error.message)
      this.users = users || []
      return { users }
    },

    async createUser(name, email, role) {
      const { data: user, error } = await supabase
        .from('profiles')
        .insert({ name, email, role })
        .select()
        .single()

      if (error) throw new Error(error.message)
      this.users.push(user)
      return { user }
    },

    async updateUser(id, name, role) {
      const { data: user, error } = await supabase
        .from('profiles')
        .update({ name, role })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      const idx = this.users.findIndex((u) => u.id === id)
      if (idx >= 0) this.users[idx] = user
      return { user }
    },

    async deleteUser(id) {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw new Error(error.message)
      this.users = this.users.filter((u) => u.id !== id)
    },

    async fetchPeople() {
      const { data: people, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .neq('id', this.currentUser?.id)

      if (error) throw new Error(error.message)
      return people || []
    },
  },
})

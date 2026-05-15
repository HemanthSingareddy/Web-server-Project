import { defineStore } from 'pinia'
import { loginUser, registerUser, getCurrentUser, signOut } from '../services/supabaseAuth'
import { supabase } from '../services/supabaseClient'

// Key used only to indicate that a session exists, never stores the actual token
const SESSION_MARKER_KEY = 'hasSession'

export const useTrackerStore = defineStore('tracker', {
  state: () => ({
    currentUser: null,
    token: null,
    hasSession: !!localStorage.getItem(SESSION_MARKER_KEY),
    users: [],
    exerciseTypes: [],
    activities: [],
    friends: [],
    feed: [],
    feedOffset: 0,
    feedItemsPerPage: 10,
    feedTotal: 0,
    feedHasMore: true,
    feedLoading: false,
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
      
      // Reset feed state on bootstrap
      this.feedOffset = 0
      this.feedTotal = 0
      this.feedHasMore = true
      this.feedLoading = false
      
      try {
        await this.fetchMe()
        await Promise.all([
          this.fetchExerciseTypes(),
          this.fetchActivities(),
          this.fetchFriends(),
        ])
        await this.fetchFriendFeed(0)
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
      this.feedOffset = 0
      this.feedTotal = 0
      this.feedHasMore = true
      this.feedLoading = false
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
      const list = activities || []
      this.summary = {
        total_workouts: list.length,
        total_minutes: list.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0),
      }
      return { summary: this.summary }
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
        .select('*, users!friend_id(id, name, email)')
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
    async fetchFriendFeed(offset = 0) {
      if (!this.currentUser?.id) return { feed: [] }
      const friendIds = this.friends.map((f) => f.friend_id)
      if (friendIds.length === 0) {
        this.feed = []
        this.feedOffset = 0
        this.feedTotal = 0
        this.feedHasMore = false
        this.feedLoading = false
        return { feed: [] }
      }

      try {
        this.feedLoading = true
        const itemsPerPage = this.feedItemsPerPage
        const endIndex = offset + itemsPerPage - 1

        // Get total count with separate query
        const { count: totalCount, error: countError } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .in('user_id', friendIds)

        if (countError) throw new Error(countError.message)

        // Get paginated data
        const { data: feed, error } = await supabase
          .from('activities')
          .select('*, exercise_types(name), users!user_id(name)')
          .in('user_id', friendIds)
          .order('date', { ascending: false })
          .range(offset, endIndex)

        if (error) throw new Error(error.message)

        // Replace on first load, append on subsequent loads
        if (offset === 0) {
          this.feed = feed || []
        } else {
          this.feed.push(...(feed || []))
        }

        // Update pagination state
        this.feedTotal = totalCount || 0
        this.feedHasMore = (feed?.length || 0) === itemsPerPage
        this.feedLoading = false

        return { feed }
      } catch (error) {
        this.feedLoading = false
        console.error('Failed to fetch friend feed:', error)
        throw error
      }
    },

    async fetchMoreFriendFeed() {
      // Check if already loading or no more items to load
      if (this.feedLoading || !this.feedHasMore) {
        return
      }

      try {
        // Calculate new offset
        const newOffset = this.feedOffset + this.feedItemsPerPage

        // Call fetchFriendFeed with new offset
        await this.fetchFriendFeed(newOffset)

        // Update the offset
        this.feedOffset = newOffset
      } catch (error) {
        console.error('Failed to fetch more friend feed items:', error)
        throw error
      }
    },

    // Users (admin)
    async fetchUsers() {
      const { data: users, error } = await supabase.from('users').select('*')
      if (error) throw new Error(error.message)
      this.users = users || []
      return { users }
    },

    async createUser(name, email, role) {
      const { data: user, error } = await supabase
        .from('users')
        .insert({ name, email, role })
        .select()
        .single()

      if (error) throw new Error(error.message)
      this.users.push(user)
      return { user }
    },

    async updateUser(id, name, role) {
      const { data: user, error } = await supabase
        .from('users')
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
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw new Error(error.message)
      this.users = this.users.filter((u) => u.id !== id)
    },

    async fetchPeople() {
      if (!this.currentUser?.id) throw new Error('Not authenticated')
      const { data: people, error } = await supabase
        .from('users')
        .select('id, name, email')
        .neq('id', this.currentUser.id)

      if (error) throw new Error(error.message)
      return people || []
    },
  },
})

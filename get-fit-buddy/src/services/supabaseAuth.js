import { supabase } from './supabaseClient'

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email,
      role: data.user.user_metadata?.role || 'user',
    },
    token: data.session.access_token,
  }
}

export async function registerUser(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: 'user' } },
  })
  if (error) throw new Error(error.message)
  // When email confirmation is required, data.session is null
  if (!data.session) {
    throw new Error('Registration successful – please check your email to confirm your account before logging in.')
  }
  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || name,
      role: data.user.user_metadata?.role || 'user',
    },
    token: data.session.access_token,
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  if (!data.user) return null
  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || data.user.email,
    role: data.user.user_metadata?.role || 'user',
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

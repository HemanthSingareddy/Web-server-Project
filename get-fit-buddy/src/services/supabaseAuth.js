import { supabase } from './supabaseClient'

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (!profile) {
    throw new Error('User profile row not found in users table.')
  }

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role || 'user',
    },
    token: data.session.access_token,
  }
}

export async function registerUser(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Registration failed')

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email,
      name,
      role: 'user',
    })
    .select('id, email, name, role')
    .single()

  if (userError) throw new Error(userError.message)

  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) throw new Error(loginError.message)

  return {
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role || 'user',
    },
    token: loginData.session.access_token,
  }
}

export async function getCurrentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(sessionError.message)
  if (!sessionData.session) return null

  const { data: userRow, error } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', sessionData.session.user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!userRow) return null

  return {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role || 'user',
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

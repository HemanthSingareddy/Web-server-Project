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
    options: { 
      data: { name, role: 'user' },
      // Disable email confirmation
      emailRedirectTo: undefined,
    },
  })
  if (error) throw new Error(error.message)
  
  // Allow registration without email confirmation
  // Even if data.session is null, we still auto-login
  if (data.user) {
    // Try to sign in immediately after registration
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (loginError) {
      throw new Error('Account created but auto-login failed. Please log in manually.')
    }
    
    return {
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        name: loginData.user.user_metadata?.name || name,
        role: loginData.user.user_metadata?.role || 'user',
      },
      token: loginData.session.access_token,
    }
  }
  
  throw new Error('Registration failed')
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

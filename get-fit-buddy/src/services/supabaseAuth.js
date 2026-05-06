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
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(sessionError.message)

  const sessionUser = sessionData?.session?.user
  if (!sessionUser) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', sessionUser.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(profileError.message)
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    name: profile?.name || sessionUser.user_metadata?.name || sessionUser.email,
    role: profile?.role || sessionUser.user_metadata?.role || 'user',
  }
}
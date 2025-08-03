import { createClient } from '@supabase/supabase-js'

// Load environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.trim()

// Basic sanity check for required values
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Missing URL or Anon Key. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

// Create the public supabase client for use in your frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// Export a config object for troubleshooting/logging
export const supabaseConfig = {
  url: supabaseUrl,
  hasAnonKey: Boolean(supabaseAnonKey),
  hasServiceRoleKey: Boolean(serviceRoleKey),
  /**
   * Returns true ONLY if the app is misconfigured.
   */
  isMisconfigured: !supabaseUrl.startsWith('https://') || !supabaseAnonKey
}

// Backend (admin) client, only for secure server-side use—not in the browser!
export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null

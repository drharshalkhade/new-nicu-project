import { supabase } from "../lib/supabaseClient"

  export const signUp = async (
  email,
  password,
  userData
) => {
  const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: userData,
  },
})

if (error) throw error

const userId = data.user?.id
if (!userId) throw new Error('User ID missing')

const { error: insertError } = await supabase.from('users').insert([
  {
    id: userId,
    email,
    ...userData,
    is_active: true,
  },
])

if (insertError) throw insertError

return data

}
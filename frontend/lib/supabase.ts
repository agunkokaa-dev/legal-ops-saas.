import { createClient } from '@supabase/supabase-js'

export const supabaseClient = async (clerkToken: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            // Menyuntikkan token Clerk ke setiap request Supabase
            headers: {
                Authorization: `Bearer ${clerkToken}`,
            },
        },
    })

    return supabase
}
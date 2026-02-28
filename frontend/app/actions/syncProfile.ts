'use server'
import { createClient } from '@supabase/supabase-js'

export async function syncProfile(token: string, userId: string, email: string, tenantId: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.warn("Supabase credentials missing, skipping profile sync.")
            return
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        const { error } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                tenant_id: tenantId
            })

        if (error) throw error
        console.log("Profile synced successfully for:", email)
    } catch (err) {
        console.error("Failed to sync profile:", JSON.stringify(err, null, 2))
    }
}

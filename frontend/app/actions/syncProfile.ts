'use server'
import { supabaseClient } from '@/lib/supabase'

export async function syncProfile(token: string, userId: string, email: string, tenantId: string) {
    try {
        const supabase = await supabaseClient(token)
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                tenant_id: tenantId
            })

        if (error) throw error
        console.log("Profile synced successfully for:", email)
    } catch (err) {
        console.error("Failed to sync profile:", err)
    }
}

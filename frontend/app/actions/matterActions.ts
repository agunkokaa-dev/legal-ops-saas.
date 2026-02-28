'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// INI DIA YANG BIKIN MERAH KALAU HILANG: Inisialisasi supabaseAdmin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

// 1. Logika Compliance Shield
export async function runComplianceShield(clientName: string) {
    const { userId, orgId } = await auth()
    if (!userId) return { error: "Unauthorized" }

    const tenantId = orgId || userId

    try {
        const { data, error } = await supabaseAdmin
            .from('matters')
            .select('id, title, status, client_name')
            .eq('tenant_id', tenantId)
            .ilike('client_name', `%${clientName}%`)
            .limit(5)

        if (error) throw error
        return { conflicts: data || [] }
    } catch (e: any) {
        return { error: e.message }
    }
}

// 2. Logika Simpan Matter Baru (Yang udah dibersihin dari error linter)
export async function createNewMatter(data: { title: string; description: string; practice_area: string; client_name: string }) {
    const { userId, orgId } = await auth()
    if (!userId) return { error: "Unauthorized" }

    const tenantId = orgId || userId
    const { title, description, practice_area, client_name } = data;

    // Validasi kita tambah description
    if (!title || !practice_area || !client_name) {
        return { error: "Missing required fields." }
    }

    try {
        const { error } = await supabaseAdmin
            .from('matters')
            .insert({
                tenant_id: tenantId,
                title: title,
                description: description, // <-- INI YANG BARU MASUK
                practice_area: practice_area,
                client_name: client_name,
                status: 'Open'
            })

        if (error) {
            console.error("🔥 ERROR SUPABASE ASLI:", error);
            throw error;
        }

        revalidatePath('/dashboard/matters')
        return { success: true }
    } catch (e: any) {
        return { error: e.message || "Unknown database error. Check terminal." }
    }
}

// 3. Logika Delete Matter
export async function deleteMatter(matterId: string) {
    const { userId, orgId } = await auth()
    if (!userId) return { error: "Unauthorized" }

    const tenantId = orgId || userId

    try {
        const { error } = await supabaseAdmin
            .from('matters')
            .delete()
            .eq('id', matterId)
            .eq('tenant_id', tenantId) // Keamanan ganda: Cuma bisa hapus data miliknya sendiri

        if (error) {
            console.error("🔥 ERROR DELETE SUPABASE:", error);
            throw error;
        }

        revalidatePath('/dashboard/matters')
        return { success: true }
    } catch (e: any) {
        return { error: e.message || "Failed to delete matter." }
    }
}
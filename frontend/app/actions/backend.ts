'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

// 1. Chat Action
export async function chatWithClause(question: string) {
    const { userId, orgId } = await auth()
    const tenantId = orgId || userId

    if (!tenantId) {
        throw new Error("Unauthorized: No tenant or user ID found.")
    }

    try {
        const formData = new FormData()
        formData.append('question', question)
        formData.append('tenant_id', tenantId)

        const response = await fetch(`${FASTAPI_URL}/api/chat`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || 'Failed to chat with AI')
        }

        return await response.json()
    } catch (error: any) {
        console.error("Chat Action Error:", error)
        throw new Error(error.message || "Internal server error")
    }
}

// 2. Upload Action
export async function uploadDocument(formData: FormData) {
    const { userId, orgId } = await auth()
    const tenantId = orgId || userId

    if (!tenantId) {
        return { success: false, error: "Unauthorized: No tenant or user ID found." }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { success: false, error: "No file provided." }
    }

    try {
        const backendFormData = new FormData()
        backendFormData.append('file', file)
        backendFormData.append('tenant_id', tenantId)

        const response = await fetch(`${FASTAPI_URL}/api/upload`, {
            method: 'POST',
            body: backendFormData,
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return { success: false, error: errorData.detail || 'Failed to upload document' }
        }

        const data = await response.json()
        revalidatePath('/dashboard')
        return { success: true, data }
    } catch (error: any) {
        console.error("Upload Action Error:", error)
        return { success: false, error: error.message || "Internal server error" }
    }
}

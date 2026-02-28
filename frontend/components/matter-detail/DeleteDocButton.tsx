'use client'

import { useState } from 'react'
import { deleteDocument } from '@/app/actions/documentActions'

export default function DeleteDocButton({ documentId, fileUrl, matterId }: { documentId: string, fileUrl: string, matterId: string }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this document?')) return

        setIsDeleting(true)
        await deleteDocument(documentId, fileUrl, matterId)
        setIsDeleting(false)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-text-muted hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete Document"
        >
            <span className={`material-symbols-outlined text-[16px] ${isDeleting ? 'animate-spin' : ''}`}>
                {isDeleting ? 'sync' : 'delete'}
            </span>
        </button>
    )
}

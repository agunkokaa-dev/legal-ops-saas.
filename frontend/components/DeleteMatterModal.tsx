'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { deleteMatter } from '@/app/actions/matterActions'

export default function DeleteMatterModal({ matterId, matterTitle }: { matterId: string, matterTitle: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Wajib untuk Portal di Next.js
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleDelete = async () => {
        setIsDeleting(true)
        const res = await deleteMatter(matterId)

        if (res.success) {
            setIsOpen(false)
        } else {
            alert("Failed to delete: " + res.error)
        }
        setIsDeleting(false)
    }

    const modalContent = isOpen ? (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isDeleting && setIsOpen(false)}
        >
            <div
                className="bg-surface border border-surface-border w-full max-w-md rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden relative z-50 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Konten Peringatan */}
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <span className="material-symbols-outlined text-red-500">warning</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-display text-white">Delete Matter</h3>
                        <p className="text-sm text-text-muted mt-2">
                            Are you sure you want to permanently delete <strong className="text-white">{matterTitle}</strong>? This action cannot be undone.
                        </p>
                    </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-surface-border bg-surface/50">
                    <button
                        onClick={() => setIsOpen(false)}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-500/10 border border-red-500/50 px-4 py-2 rounded text-sm text-red-500 font-medium hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            {/* Tombol Icon Trash di Tabel */}
            <button
                onClick={() => setIsOpen(true)}
                title="Delete Matter"
                className="text-text-muted hover:text-red-500 transition-colors p-2 rounded hover:bg-red-500/10 flex items-center justify-center"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>

            {/* Render Modal via Portal */}
            {mounted && createPortal(modalContent, document.body)}
        </>
    )
}

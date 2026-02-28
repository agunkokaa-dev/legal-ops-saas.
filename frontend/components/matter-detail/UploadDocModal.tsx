'use client'

import { useState } from 'react'
import { uploadDocument } from '@/app/actions/documentActions'

export default function UploadDocModal({ matterId, existingDocs = [] }: { matterId: string, existingDocs?: { id: string, title: string }[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Genealogy State
    const [category, setCategory] = useState("Uncategorized")
    const [parentId, setParentId] = useState("")
    const [relationshipType, setRelationshipType] = useState("amends")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setIsUploading(true)

        const formData = new FormData(e.currentTarget)
        formData.append('document_category', category)
        if (parentId) {
            formData.append('parent_id', parentId)
            formData.append('relationship_type', relationshipType)
        }

        const res = await uploadDocument(matterId, formData)

        setIsUploading(false)
        if (res?.error) {
            setError(res.error)
        } else {
            setIsOpen(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Upload Document
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="relative w-full max-w-md bg-surface shadow-2xl border border-surface-border p-6 rounded animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-display text-white">Upload Document</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-text-muted hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Document Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-background-dark border border-surface-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                                >
                                    <option value="Uncategorized">Uncategorized</option>
                                    <option value="MSA">MSA</option>
                                    <option value="NDA">NDA</option>
                                    <option value="SOW">SOW</option>
                                    <option value="Amendment">Amendment</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {existingDocs && existingDocs.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Parent Document (Optional)</label>
                                    <select
                                        value={parentId}
                                        onChange={(e) => setParentId(e.target.value)}
                                        className="w-full bg-background-dark border border-surface-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="">-- No Parent (Standalone) --</option>
                                        {existingDocs.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.title.length > 40 ? doc.title.substring(0, 40) + '...' : doc.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {parentId && (
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-2">Relationship Type</label>
                                    <select
                                        value={relationshipType}
                                        onChange={(e) => setRelationshipType(e.target.value)}
                                        className="w-full bg-background-dark border border-surface-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="amends">Amends</option>
                                        <option value="governs">Governs</option>
                                        <option value="exhibit_to">Exhibit To</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-text-muted mb-2">Select File</label>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    required
                                    className="block w-full text-sm text-text-muted
                                      file:mr-4 file:py-2 file:px-4
                                      file:rounded-full file:border-0
                                      file:text-sm file:font-semibold
                                      file:bg-primary/10 file:text-primary
                                      hover:file:bg-primary/20 transition-colors"
                                />
                                <p className="text-xs text-text-muted mt-2">Supported formats: PDF, DOC, DOCX</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-surface-border">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm text-text-muted hover:text-white transition-colors"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[16px]">hourglass_empty</span>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

'use client'
import { useState, useRef } from 'react'
import { uploadDocument } from '@/app/actions/backend'

export default function DocumentUpload() {
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'extracting' | 'indexing' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0])
            setStatus('idle')
            setErrorMessage('')
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setStatus('uploading')

        // Simulate granular progress states for better UX visibility
        const extractTimer = setTimeout(() => {
            setStatus('extracting')
        }, 1500)

        const indexTimer = setTimeout(() => {
            setStatus('indexing')
        }, 3000)

        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadDocument(formData)

        clearTimeout(extractTimer)
        clearTimeout(indexTimer)

        if (result.success) {
            setStatus('success')
        } else {
            setStatus('error')
            setErrorMessage(result.error || "An unknown error occurred.")
        }
    }

    return (
        <div className="bg-surface border border-surface-border p-6 rounded">
            <h3 className="font-display text-xl text-white mb-4">Secure Vault Upload</h3>
            <div className="flex flex-col gap-4">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-surface-border/20 hover:bg-surface-border/50 border border-surface-border border-dashed text-white px-4 py-8 rounded flex flex-col items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-3xl mb-2 text-text-muted">upload_file</span>
                    <span className="text-sm">{file ? file.name : "Select PDF Document (Contracts, NDAs, etc.)"}</span>
                </button>

                {file && status === 'idle' && (
                    <button
                        onClick={handleUpload}
                        className="bg-primary hover:bg-primary/90 text-background-dark font-medium py-2 rounded transition-colors text-sm"
                    >
                        Upload & Index to Vault
                    </button>
                )}

                {status !== 'idle' && status !== 'success' && status !== 'error' && (
                    <div className="flex flex-col gap-2 p-4 border border-primary/20 bg-primary/5 rounded">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary" style={{ animation: 'spin 2s linear infinite' }}>sync</span>
                            <span className="text-primary text-sm font-medium">
                                {status === 'uploading' && "Uploading PDF securely..."}
                                {status === 'extracting' && "Extracting & validating text contents..."}
                                {status === 'indexing' && "Indexing clauses for AI retrieval..."}
                            </span>
                        </div>
                        <div className="h-1 w-full bg-surface-border rounded-full overflow-hidden mt-1 relative">
                            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: status === 'uploading' ? '30%' : status === 'extracting' ? '60%' : '90%' }}
                            ></div>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded flex items-center gap-3 text-sm">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>Document securely indexed in Tenant Vault. Ready for querying.</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded flex items-start gap-3 text-sm">
                        <span className="material-symbols-outlined mt-0.5">error</span>
                        <div className="flex flex-col">
                            <span className="font-semibold">Upload Rejected</span>
                            <span className="opacity-90">{errorMessage}</span>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

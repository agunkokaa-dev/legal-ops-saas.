'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    PdfLoader,
    PdfHighlighter,
    Highlight,
    Popup,
    AreaHighlight
} from 'react-pdf-highlighter'
import 'react-pdf-highlighter/dist/style.css'
import * as pdfjs from 'pdfjs-dist'
import { getNotesByContract, createNote } from '@/app/actions/noteActions'
import { useRouter } from 'next/navigation'
// 1. Stable reference to prevent crash
const EMPTY_HIGHLIGHTS: any[] = [];
// 2. Strict worker version matching the Viewer
const WORKER_URL = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

interface PDFHighlighterComponentProps {
    fileUrl: string
    contractId: string
}

export default function PDFHighlighterComponent({ fileUrl, contractId }: PDFHighlighterComponentProps) {
    const router = useRouter()

    const [isMounted, setIsMounted] = useState(false)
    const [highlights, setHighlights] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [pdfUrl, setPdfUrl] = useState<string>('')

    // Resolve Supabase Storage URL if needed, or use directly if it's already an absolute URL
    useEffect(() => {
        if (!fileUrl) return;

        let url = fileUrl;
        if (!url.startsWith('http') && !url.startsWith('/')) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            url = `${supabaseUrl}/storage/v1/object/public/matter-files/${fileUrl}`
        }
        setPdfUrl(url)
    }, [fileUrl])

    // Fetch existing notes
    useEffect(() => {
        async function fetchNotes() {
            const { data, error } = await getNotesByContract(contractId)
            if (data && !error) {
                // Map the DB notes back into react-pdf-highlighter highlight structures
                const mappedHighlights = data.map(dbNote => ({
                    id: dbNote.id,
                    content: { text: dbNote.quote },
                    comment: { text: dbNote.comment },
                    position: dbNote.position_data
                }))
                setHighlights(mappedHighlights)
            }
        }
        fetchNotes()
    }, [contractId])

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Save a new highlight
    const addHighlight = useCallback(
        async (highlight: any) => {
            setIsSaving(true)

            // Immediately optimistically update UI
            const optimisticId = `temp-${Date.now()}`
            setHighlights(prev => [{ ...highlight, id: optimisticId }, ...prev])

            try {
                const { data, error } = await createNote({
                    contractId: contractId,
                    quote: highlight.content.text || '',
                    comment: highlight.comment.text || '',
                    positionData: highlight.position
                })

                if (data && !error) {
                    // Update temp ID with real DB ID
                    setHighlights(prev =>
                        prev.map(h =>
                            h.id === optimisticId ? { ...h, id: data.id } : h
                        )
                    )
                    router.refresh()
                } else {
                    console.error("Failed to save note", error)
                    setHighlights(prev => prev.filter(h => h.id !== optimisticId))
                }
            } catch (error) {
                console.error("Error creating note:", error)
                setHighlights(prev => prev.filter(h => h.id !== optimisticId))
            } finally {
                setIsSaving(false)
            }
        },
        [contractId, router]
    )


    const safeUrl = pdfUrl || fileUrl || "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";

    // DO NOT RENDER ANYTHING until mounted to prevent Strict Mode DOM ref crashes
    if (!isMounted) {
        return <div className="h-full w-full flex items-center justify-center bg-[#1e1e24] text-white">Initializing Workspace...</div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-[#1e1e24] relative z-10 w-full h-full border border-border-dark rounded-xl overflow-hidden shadow-2xl">
            {/* Document Render Area */}
            <div className="flex-1 overflow-hidden relative w-full h-full bg-[#1e1e24]">
                <PdfLoader
                    url={safeUrl}
                    workerSrc={WORKER_URL} /* STRICT BINDING: Bypasses global cache */
                    beforeLoad={<div className="flex h-full w-full items-center justify-center text-white">Loading Document Engine...</div>}
                    onError={(err: any) => <div className="p-10 text-red-500">Error: {String(err.message || err)}</div>}
                >
                    {(pdfDocument) => (
                        <PdfHighlighter
                            pdfDocument={pdfDocument}
                            enableAreaSelection={event => event.altKey}
                            onScrollChange={() => { }}
                            pdfScaleValue="page-width" // Critical for initial render calculations
                            highlights={highlights.length > 0 ? highlights : EMPTY_HIGHLIGHTS} // Stable memory reference
                            scrollRef={() => { }}
                            highlightTransform={(highlight: any, index: number) => (
                                <div key={index} className="bg-luxury-gold/40 absolute" style={{ ...highlight.position }}></div>
                            )}
                            onSelectionFinished={(
                                position,
                                content,
                                hideTipAndSelection,
                                transformSelection
                            ) => {
                                // Provide a Tip/Pop-up to ask for the comment when text is selected
                                return (
                                    <HighlightCommentPrompt
                                        onSave={(comment) => {
                                            addHighlight({ content, position, comment: { text: comment } })
                                            hideTipAndSelection()
                                        }}
                                        onCancel={hideTipAndSelection}
                                    />
                                );
                            }}
                        />
                    )}
                </PdfLoader>
            </div>
        </div>
    )
}

// Sub-component rendering the modal/tooltip form indicating new highlights
function HighlightCommentPrompt({ onSave, onCancel }: { onSave: (comment: string) => void, onCancel: () => void }) {
    const [comment, setComment] = useState('')

    return (
        <div className="bg-surface border border-surface-border p-3 rounded-lg shadow-2xl min-w-[250px] animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-xs font-bold text-white mb-2 font-serif">Add Note</h4>
            <textarea
                value={comment}
                autoFocus
                onChange={(e) => setComment(e.target.value)}
                placeholder="What exactly is important about this clause?"
                className="w-full bg-background border border-surface-border rounded p-2 text-xs text-white placeholder-text-muted focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] resize-none h-20 mb-3"
            />
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1 text-xs text-text-muted hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onSave(comment)}
                    className="px-3 py-1 text-xs bg-white text-black font-medium rounded hover:bg-gray-200 transition-colors"
                >
                    Save Note
                </button>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
    scrollToId?: string | null
    notes?: any[]
}

export default function PDFHighlighterComponent({ fileUrl, contractId, scrollToId, notes }: PDFHighlighterComponentProps) {
    const router = useRouter()
    const scrollToFnRef = useRef<((highlight: any) => void) | null>(null)

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

    const parsedHighlights = useMemo(() => {
        if (!notes || !Array.isArray(notes) || notes.length === 0) {
            return EMPTY_HIGHLIGHTS;
        }

        const validHighlights = notes.map((note) => {
            // Handle cases where the position might be stored as a JSON string in the DB
            let positionData;
            const pos = note.position_data || note.position;
            try {
                positionData = typeof pos === 'string' ? JSON.parse(pos) : pos;
            } catch (e) {
                positionData = null;
            }

            // Only return if valid position data exists
            if (positionData && positionData.boundingRect) {
                return {
                    id: String(note.id),
                    content: { text: note.quote || note.content || note.text || '' },
                    position: positionData,
                    comment: { text: note.comment || '' }
                };
            }
            return null;
        }).filter(Boolean); // Remove any nulls (notes without valid coordinates)

        return validHighlights.length > 0 ? validHighlights : EMPTY_HIGHLIGHTS;
    }, [notes]);

    // Combine parsed with local optimistic state
    const allHighlights = useMemo(() => {
        const parsedIds = new Set((parsedHighlights === EMPTY_HIGHLIGHTS ? [] : parsedHighlights).map((h: any) => h.id));
        const optimistic = highlights.filter(h => !parsedIds.has(String(h.id)) && !parsedIds.has(h.id));

        if (parsedHighlights === EMPTY_HIGHLIGHTS && optimistic.length === 0) {
            return EMPTY_HIGHLIGHTS;
        }
        return [...(parsedHighlights === EMPTY_HIGHLIGHTS ? [] : parsedHighlights), ...optimistic];
    }, [parsedHighlights, highlights]);

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

    // Scroll to highlight when scrollToId changes
    useEffect(() => {
        if (scrollToId && scrollToFnRef.current) {
            const target = allHighlights.find((h: any) => h.id === scrollToId)
            if (target) {
                scrollToFnRef.current(target)
            }
        }
    }, [scrollToId, allHighlights])

    const safeUrl = pdfUrl || fileUrl || "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf";

    // DO NOT RENDER ANYTHING until mounted to prevent Strict Mode DOM ref crashes
    if (!isMounted) {
        return <div className="h-full w-full flex items-center justify-center bg-[#1e1e24] text-white">Initializing Workspace...</div>;
    }

    console.log("🔥 PARSED HIGHLIGHTS FOR RENDER:", parsedHighlights);

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
                            key={`highlighter-${allHighlights.length}-${contractId}`} // Forces unmount on change
                            pdfDocument={pdfDocument}
                            enableAreaSelection={event => event.altKey}
                            onScrollChange={() => { }}
                            pdfScaleValue="page-width" // Critical for initial render calculations
                            highlights={allHighlights} // Stable memory reference
                            scrollRef={(scrollTo) => {
                                scrollToFnRef.current = scrollTo;
                            }}
                            highlightTransform={(
                                highlight: any,
                                index: number,
                                setTip: any,
                                hideTip: any,
                                viewportToScaled: any,
                                screenshot: any,
                                isScrolledTo: boolean
                            ) => (
                                <Highlight
                                    key={index}
                                    isScrolledTo={isScrolledTo}
                                    position={highlight.position}
                                    comment={highlight.comment}
                                />
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

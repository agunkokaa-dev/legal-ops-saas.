'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import IntelligenceSidebar from './IntelligenceSidebar'
import PDFViewerWrapper from './PDFViewerWrapper'

export default function ContractDetailClient({
    pdfUrl,
    contract,
    obligations,
    notes,
    clientName,
    graphDocs,
    graphRels
}: {
    pdfUrl: string,
    contract: any,
    obligations: any[],
    notes: any[],
    clientName: string,
    graphDocs: any[],
    graphRels: any[]
}) {
    const [scrollToId, setScrollToId] = useState<string | null>(null);
    const router = useRouter();

    return (
        <div className="flex h-[calc(100vh-70px)] w-full overflow-hidden bg-background">
            {/* LEFT: PDF Viewer - takes remaining width, strict height */}
            <div className="flex-1 h-full min-w-0 overflow-hidden relative">
                <PDFViewerWrapper
                    fileUrl={pdfUrl}
                    contractId={contract.id}
                    scrollToId={scrollToId}
                    notes={notes}
                />
            </div>
            {/* RIGHT: Sidebar - fixed width, strict height */}
            <div className="w-[400px] h-full flex-shrink-0 overflow-hidden">
                <IntelligenceSidebar
                    contract={contract}
                    obligations={obligations}
                    notes={notes}
                    clientName={clientName}
                    graphDocs={graphDocs}
                    graphRels={graphRels}
                    onNoteClick={setScrollToId}
                    onNoteDeleted={() => router.refresh()}
                />
            </div>
        </div>
    )
}

import { getContractById } from '@/app/actions/documentActions';
import { getObligationsByMatter } from '@/app/actions/obligationActions';
import { getNotesByContract } from '@/app/actions/noteActions';
import IntelligenceSidebar from '@/components/contract-detail/IntelligenceSidebar';
import PDFViewerWrapper from '@/components/contract-detail/PDFViewerWrapper';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params for Next 15+ compatibility
    const resolvedParams = await params;
    const contractId = resolvedParams.id;

    // Fetch contract
    const { data: contract, error } = await getContractById(contractId);

    if (error || !contract) {
        return (
            <div className="h-full flex items-center justify-center text-text-muted">
                Failed to load contract details.
            </div>
        );
    }

    // Fetch obligations
    const { data: allObligations } = await getObligationsByMatter(contract.matter_id);
    const obligations = allObligations?.filter((o: any) => o.contract_id === contract.id) || [];

    // Fetch notes
    const { data: allNotes } = await getNotesByContract(contract.id);
    const notes = allNotes || [];

    // Safely format date
    const formattedDate = contract.created_at
        ? new Date(contract.created_at).toISOString().split('T')[0]
        : 'Unknown Date';

    // Resolve Supabase Storage public address
    let pdfUrl = contract.file_url;
    if (pdfUrl && !pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
        pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/matter-files/${pdfUrl}`;
    }

    return (
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative w-full">
            {/* Header */}
            <header className="h-16 bg-background border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0 z-20 w-full">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/matters/${contract.matter_id}`} className="text-text-muted hover:text-white transition-colors flex items-center">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base font-serif font-bold text-white tracking-tight">
                                {contract.title || contract.file_url || 'Unknown Contract'}
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                                Status: Draft
                            </span>
                            <button className="text-text-muted hover:text-white flex items-center">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                        </div>
                        <p className="text-text-muted text-[11px] mt-0.5">
                            Client • 4 • Last modified: {formattedDate}
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative w-full">
                <PDFViewerWrapper fileUrl={pdfUrl} contractId={contract.id} />
                <IntelligenceSidebar contract={contract} obligations={obligations} notes={notes} />
            </div>
        </main>
    );
}

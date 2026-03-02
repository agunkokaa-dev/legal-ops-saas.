import { getMatterDocuments } from '@/app/actions/documentActions'
import UploadDocModal from './UploadDocModal'
import DeleteDocButton from './DeleteDocButton'
import Link from 'next/link'

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export default async function DocumentsTab({ matterId }: { matterId: string }) {
    const { data: documents } = await getMatterDocuments(matterId)
    const docs = documents || []

    return (
        <div className="bg-surface border border-surface-border rounded-lg overflow-hidden mt-6">
            <div className="p-6 border-b border-surface-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background-dark/30">
                <div>
                    <h2 className="text-lg font-display text-white">Documents</h2>
                    <p className="text-sm text-text-muted mt-1">Manage files associated with this matter</p>
                </div>
                <UploadDocModal matterId={matterId} existingDocs={docs} />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-transparent text-text-muted text-[10px] uppercase tracking-widest border-b border-surface-border">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Name</th>
                            <th className="px-6 py-4 font-semibold">Category</th>
                            <th className="px-6 py-4 font-semibold">Risk Level</th>
                            <th className="px-6 py-4 font-semibold">End Date</th>
                            <th className="px-6 py-4 font-semibold">Date Uploaded</th>
                            <th className="px-6 py-4 font-semibold text-right">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50 text-sm">
                        {docs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                    No documents uploaded yet.
                                </td>
                            </tr>
                        ) : (
                            docs.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary text-[20px]">
                                                description
                                            </span>
                                            <Link
                                                href={`/dashboard/contracts/${doc.id}`}
                                                className="font-medium text-white hover:text-lux-gold transition-colors hover:underline cursor-pointer"
                                                title={doc.title}
                                            >
                                                {doc.title.length > 40 ? doc.title.substring(0, 40) + '...' : doc.title}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-border text-text-muted border border-white/5">
                                            {doc.document_category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${doc.risk_level === 'High' ? 'text-red-400' :
                                            doc.risk_level === 'Medium' ? 'text-yellow-400' :
                                                doc.risk_level === 'Low' ? 'text-green-400' :
                                                    'text-text-muted'
                                            }`}>
                                            {doc.risk_level || 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-muted">
                                        {doc.end_date || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-text-muted">
                                        {formatDate(doc.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DeleteDocButton documentId={doc.id} fileUrl={doc.file_url} matterId={matterId} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

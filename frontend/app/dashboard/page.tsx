import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncProfile } from '@/app/actions/syncProfile'
import DocumentUpload from '@/components/DocumentUpload'

export default async function DashboardPage() {
    const { userId, orgId, getToken } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
        redirect('/')
    }

    const token = await getToken({ template: 'supabase' })
    const email = user?.primaryEmailAddress?.emailAddress

    if (orgId && token && email) {
        // Sync profile to Supabase silently in the background
        void syncProfile(token, userId, email, orgId)
    }

    // Getting current date for the header
    const today = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    })

    return (
        <>
            <header className="h-16 border-b border-surface-border bg-surface/50 backdrop-blur-sm flex items-center justify-between px-8 shrink-0">
                <h1 className="font-display text-2xl text-white font-light tracking-tight">Executive Command</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined text-text-muted hover:text-white cursor-pointer">notifications</span>
                        <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
                    </div>
                    <div className="h-4 w-[1px] bg-surface-border"></div>
                    <span className="text-sm text-text-muted">{today}</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                <div className="max-w-7xl mx-auto flex flex-col gap-6">

                    {/* Clerk / Supabase Status Banner */}
                    {!orgId ? (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded flex gap-3 items-start">
                            <span className="material-symbols-outlined mt-0.5">warning</span>
                            <div>
                                <p className="font-bold text-sm">No Active Tenant</p>
                                <p className="text-xs mt-1 text-yellow-500/80">Use the Organization selector in the sidebar to create or join a Tenant.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-500 rounded flex gap-3 items-start">
                            <span className="material-symbols-outlined mt-0.5">check_circle</span>
                            <div>
                                <p className="font-bold text-sm">Supabase RLS Connected</p>
                                <p className="text-xs mt-1 text-green-500/80">Active Tenant ID: <code className="bg-green-500/20 px-1 py-0.5 rounded">{orgId}</code></p>
                            </div>
                        </div>
                    )}

                    {/* Secure File Upload Vault */}
                    {orgId && <DocumentUpload />}

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface border border-surface-border p-6 rounded hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-text-muted uppercase tracking-wider">Billable MTD</span>
                                <span className="material-symbols-outlined text-primary">trending_up</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl text-white font-light">$42,500</span>
                                <span className="text-sm text-primary font-medium">+12%</span>
                            </div>
                            <div className="mt-4 h-1 w-full bg-surface-border rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[75%]"></div>
                            </div>
                        </div>
                        <div className="bg-surface border border-surface-border p-6 rounded hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-text-muted uppercase tracking-wider">Urgent Deadlines</span>
                                <span className="material-symbols-outlined text-orange-500">warning</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl text-white font-light">3</span>
                                <span className="text-sm text-text-muted font-medium">This Week</span>
                            </div>
                            <div className="flex -space-x-2 mt-4">
                                <div className="w-6 h-6 rounded-full border border-surface bg-neutral-800 text-[10px] flex items-center justify-center text-white" title="Matter A">A</div>
                                <div className="w-6 h-6 rounded-full border border-surface bg-neutral-800 text-[10px] flex items-center justify-center text-white" title="Matter B">B</div>
                                <div className="w-6 h-6 rounded-full border border-surface bg-neutral-800 text-[10px] flex items-center justify-center text-white" title="Matter C">C</div>
                            </div>
                        </div>
                        <div className="bg-surface border border-surface-border p-6 rounded hover:border-primary/30 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-text-muted uppercase tracking-wider">Pending Signatures</span>
                                <span className="material-symbols-outlined text-text-muted">draw</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-4xl text-white font-light">7</span>
                                <span className="text-sm text-text-muted font-medium">Docs</span>
                            </div>
                            <div className="mt-4 flex gap-1">
                                <div className="h-1 flex-1 bg-primary rounded-full"></div>
                                <div className="h-1 flex-1 bg-primary rounded-full"></div>
                                <div className="h-1 flex-1 bg-primary/40 rounded-full"></div>
                                <div className="h-1 flex-1 bg-surface-border rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdowns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-surface border border-surface-border p-6 rounded flex flex-col h-[320px]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-display text-xl text-white">Active Matters</h3>
                                    <p className="text-xs text-text-muted">By Practice Area</p>
                                </div>
                                <button className="text-xs text-primary border border-primary/30 px-2 py-1 rounded hover:bg-primary/10">View All</button>
                            </div>
                            <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-2">
                                <div className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-surface-border relative h-40 rounded-t-sm overflow-hidden">
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-primary/40 h-[80%] group-hover:to-primary/60 transition-all"></div>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wide text-text-muted">Corp</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-surface-border relative h-40 rounded-t-sm overflow-hidden">
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-primary/40 h-[65%] group-hover:to-primary/60 transition-all"></div>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wide text-text-muted">IP</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-surface-border relative h-40 rounded-t-sm overflow-hidden">
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-primary/40 h-[90%] group-hover:to-primary/60 transition-all"></div>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wide text-text-muted">Litig</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full bg-surface-border relative h-40 rounded-t-sm overflow-hidden">
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-primary/40 h-[45%] group-hover:to-primary/60 transition-all"></div>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wide text-text-muted">RE</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface border border-surface-border p-6 rounded flex flex-col h-[320px]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-display text-xl text-white">Portfolio Risk Score</h3>
                                    <p className="text-xs text-text-muted">Real-time clause analysis</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                    <span className="text-xs text-text-muted">High Exposure</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 h-full">
                                <div className="bg-surface-border/30 p-4 border border-surface-border/50 rounded flex flex-col justify-between hover:bg-surface-border/50 transition-colors">
                                    <span className="text-xs text-text-muted uppercase tracking-wider">Indemnity</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-display text-white">High</span>
                                        <div className="w-12 h-1 bg-surface-border rounded-full overflow-hidden">
                                            <div className="h-full bg-red-500 w-[80%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-surface-border/30 p-4 border border-surface-border/50 rounded flex flex-col justify-between hover:bg-surface-border/50 transition-colors">
                                    <span className="text-xs text-text-muted uppercase tracking-wider">Liability Cap</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-display text-white">Med</span>
                                        <div className="w-12 h-1 bg-surface-border rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[50%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-surface-border/30 p-4 border border-surface-border/50 rounded flex flex-col justify-between hover:bg-surface-border/50 transition-colors">
                                    <span className="text-xs text-text-muted uppercase tracking-wider">Jurisdiction</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-display text-white">Low</span>
                                        <div className="w-12 h-1 bg-surface-border rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 w-[20%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-surface-border/30 p-4 border border-surface-border/50 rounded flex flex-col justify-between hover:bg-surface-border/50 transition-colors">
                                    <span className="text-xs text-text-muted uppercase tracking-wider">Termination</span>
                                    <div className="flex items-end justify-between">
                                        <span className="text-lg font-display text-white">Med</span>
                                        <div className="w-12 h-1 bg-surface-border rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[60%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-surface border border-surface-border rounded overflow-hidden">
                        <div className="px-6 py-4 border-b border-surface-border flex justify-between items-center">
                            <h3 className="font-display text-xl text-white">Recent Activity</h3>
                            <button className="text-sm text-primary hover:text-white transition-colors">View All History</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-border/20 text-text-muted text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Time</th>
                                        <th className="px-6 py-3 font-medium">User</th>
                                        <th className="px-6 py-3 font-medium">Action</th>
                                        <th className="px-6 py-3 font-medium text-right">Context</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border text-sm">
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono">10:42 AM</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">JD</div>
                                                <span className="text-white">J. Doe</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white">Edited NDA v4.2 - Adjusted Indemnity Clause</td>
                                        <td className="px-6 py-4 text-right"><span className="bg-surface-border px-2 py-1 rounded text-xs text-text-muted">Corporate</span></td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono">09:15 AM</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400">AI</div>
                                                <span className="text-white">Clause AI</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white">Risk Analysis Complete - High Exposure Detected</td>
                                        <td className="px-6 py-4 text-right"><span className="bg-surface-border px-2 py-1 rounded text-xs text-text-muted">Mergers</span></td>
                                    </tr>
                                    <tr className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-text-muted whitespace-nowrap font-mono">08:30 AM</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary">AS</div>
                                                <span className="text-white">A. Sterling</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-white">Approved Final Settlement Terms</td>
                                        <td className="px-6 py-4 text-right"><span className="bg-surface-border px-2 py-1 rounded text-xs text-text-muted">Litigation</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

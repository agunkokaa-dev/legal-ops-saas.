'use client'

import { useState } from 'react'

export default function IntelligenceSidebar({ contract, obligations = [], notes = [] }: { contract?: any, obligations?: any[], notes?: any[] }) {
    const [activeTab, setActiveTab] = useState('Analysis')

    const tabs = ['Analysis', 'Obligation', 'Notes', 'Genealogy', 'Assistant']

    return (
        <div className="w-[400px] flex-shrink-0 bg-background border-l border-surface-border flex flex-col z-20 shadow-xl overflow-hidden pt-4 pb-5 px-5">
            {/* Tabs */}
            <div
                className="flex items-center gap-2 mb-4 px-1 overflow-x-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${activeTab === tab
                            ? 'bg-surface border border-surface-border shadow-sm text-white'
                            : 'text-text-muted hover:text-white hover:bg-surface flex items-center gap-1'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-surface border border-surface-border rounded-xl shadow-lg flex flex-col flex-1 overflow-hidden relative">
                <div className="p-5 flex flex-col gap-6 overflow-y-auto h-full">
                    {activeTab === 'Analysis' ? (
                        <>
                            {/* Key Entities */}
                            <div>
                                <h3 className="text-white font-serif font-semibold text-sm mb-3 flex items-center gap-2 tracking-wide">
                                    <span className="material-symbols-outlined text-[#d4af37] text-sm">domain</span>
                                    Key Entities
                                </h3>
                                <div className="bg-background border border-surface-border rounded-lg divide-y divide-surface-border">
                                    <div className="flex justify-between items-center p-3 hover:bg-white/5 transition-colors">
                                        <span className="text-[11px] text-text-muted">Jurisdiction</span>
                                        <span className="text-[11px] text-white font-medium text-right text-gray-300">{contract?.jurisdiction || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 hover:bg-white/5 transition-colors">
                                        <span className="text-[11px] text-text-muted">Governing Law</span>
                                        <span className="text-[11px] text-white font-medium text-right">{contract?.governing_law || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 hover:bg-white/5 transition-colors">
                                        <span className="text-[11px] text-text-muted">Effective Date</span>
                                        <span className="text-[11px] text-white font-medium text-right">
                                            {contract?.effective_date ? new Date(contract.effective_date).toISOString().split('T')[0] : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Counterparty Info */}
                            <div>
                                <h3 className="text-white font-serif font-semibold text-sm mb-3 flex items-center gap-2 tracking-wide">
                                    <span className="material-symbols-outlined text-[#d4af37] text-sm">group</span>
                                    Counterparty Info
                                </h3>
                                <div className="bg-background rounded-lg p-3 border border-surface-border flex items-center gap-3 hover:border-[#d4af37]/30 transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-surface border border-surface-border flex items-center justify-center text-[#d4af37] font-bold text-xs shrink-0 group-hover:border-[#d4af37]/50 transition-colors">
                                        CP
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-white font-bold text-xs group-hover:text-[#d4af37] transition-colors">{contract?.counterparty_name || 'Unknown Client'}</div>
                                        <div className="text-text-muted text-[10px]">Counterparty</div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div>
                                <h3 className="text-white font-serif font-semibold text-sm mb-3 flex items-center gap-2 tracking-wide">
                                    <span className="material-symbols-outlined text-[#d4af37] text-sm">warning</span>
                                    Risk Assessment
                                </h3>
                                <div className="bg-background rounded-lg p-4 border border-surface-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] text-text-muted">Risk Level</span>
                                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${contract?.risk_level === 'High' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                                                contract?.risk_level === 'Medium' || contract?.risk_level === 'Moderate' ? 'text-[#d4af37] border-[#d4af37]/30 bg-[#d4af37]/10' :
                                                    contract?.risk_level === 'Low' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                                                        'text-text-muted border-surface-border bg-surface'
                                            }`}>{(contract?.risk_level || 'UNKNOWN').toUpperCase()}</span>
                                    </div>
                                    <div className="w-full bg-surface rounded-full h-1.5 mb-2">
                                        <div className={`h-1.5 rounded-full ${contract?.risk_level === 'High' ? 'bg-red-400' :
                                                contract?.risk_level === 'Medium' || contract?.risk_level === 'Moderate' ? 'bg-[#d4af37]' :
                                                    contract?.risk_level === 'Low' ? 'bg-green-400' :
                                                        'bg-surface-border'
                                            }`} style={{ width: contract?.risk_level === 'High' ? '90%' : contract?.risk_level === 'Low' ? '20%' : contract?.risk_level ? '50%' : '0%' }}></div>
                                    </div>
                                    <p className="text-[10px] text-text-muted leading-relaxed">
                                        {contract?.risk_level === 'High' ? 'Critical risks detected. Requires immediate review.' :
                                            contract?.risk_level === 'Low' ? 'Standard terms detected. Low risk.' :
                                                'Review recommended for non-standard clauses.'}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'Obligation' ? (
                        <div className="flex flex-col gap-3">
                            {obligations.length === 0 ? (
                                <div className="text-text-muted text-xs p-4 text-center border border-dashed border-surface-border rounded-lg">
                                    No obligations extracted for this document.
                                </div>
                            ) : (
                                obligations.map((obs: any, idx: number) => (
                                    <div key={obs.id || idx} className="bg-background rounded-lg p-3 border border-surface-border hover:border-[#d4af37]/30 transition-colors">
                                        <p className="text-white text-xs leading-relaxed mb-2">{obs.obligation_text}</p>
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-text-muted">Due Date</span>
                                            <span className="text-[#d4af37]">{obs.due_date ? new Date(obs.due_date).toISOString().split('T')[0] : 'N/A'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : activeTab === 'Notes' ? (
                        <div className="flex flex-col gap-3">
                            {notes.length === 0 ? (
                                <div className="text-text-muted text-xs p-4 text-center border border-dashed border-surface-border rounded-lg">
                                    Highlight text on the PDF to create a note.
                                </div>
                            ) : (
                                notes.map((note: any, idx: number) => (
                                    <div key={note.id || idx} className="bg-background rounded-lg p-3 border border-surface-border hover:border-[#d4af37]/30 transition-colors">
                                        <p className="text-text-muted text-[10px] italic mb-2 px-2 border-l-2 border-[#d4af37]/50">"{note.quote}"</p>
                                        <p className="text-white text-xs">{note.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="p-5 text-text-muted">Content for {activeTab}</div>
                    )}
                </div>
            </div>
        </div>
    )
}

'use client'

import { Handle, Position } from '@xyflow/react'
import { useRouter } from 'next/navigation'

export default function ParentNode({ data }: { data: any }) {
    const router = useRouter()

    return (
        <div
            onClick={() => data.id && router.push(`/dashboard/contracts/${data.id}`)}
            className={`bg-lux-card border rounded-lg p-5 w-80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] relative cursor-pointer transition-all
                ${data.isCurrent ? 'border-lux-gold ring-2 ring-lux-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'border-lux-border hover:ring-1 hover:ring-lux-gold'}`}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="bg-lux-gold/10 text-lux-gold text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                        {data.category || 'Parent Contract'}
                    </span>
                    <h3 className="text-xl font-serif text-white">{data.title || 'Untitled Document'}</h3>
                </div>
                <span className="material-symbols-outlined text-lux-text-muted">description</span>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                    <span className="text-xs text-lux-text-muted uppercase tracking-wider">Deal Value</span>
                    <span className="text-sm font-mono text-white">{data.dealValue || 'Not analyzed'}</span>
                </div>
                <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                    <span className="text-xs text-lux-text-muted uppercase tracking-wider">Liability Cap</span>
                    <span className="text-sm font-mono text-lux-text-body">{data.liabilityCap || 'Unknown'}</span>
                </div>
            </div>

            {/* Invisible handle for outgoing edges */}
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    )
}


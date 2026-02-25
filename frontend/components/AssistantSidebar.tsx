'use client'

import { useState, useRef, useEffect } from 'react'
import { chatWithClause } from '@/app/actions/backend'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: { contract_id: string }[]
}

export default function AssistantSidebar() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Good morning, Partner. I am securely connected to your isolated RAG vault. How can I assist you with your contracts today?",
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const result = await chatWithClause(userMessage.content)

            setMessages(prev => [...prev, {
                id: Date.now().toString() + 'ai',
                role: 'assistant',
                content: result.answer,
                citations: result.citations
            }])
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: Date.now().toString() + 'err',
                role: 'assistant',
                content: `Error: ${error.message || "Failed to communicate with intelligence engine."}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <aside className="w-80 border-l border-surface-border bg-surface hidden xl:flex flex-col shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-surface-border bg-surface">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                    <h2 className="font-display text-lg text-white">Clause Assistant</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'assistant' ? (
                            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                                <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0 mt-1">
                                <span className="text-xs text-white">ME</span>
                            </div>
                        )}
                        <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''} max-w-[85%]`}>
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${msg.role === 'assistant' ? 'text-primary' : 'text-text-muted'}`}>
                                {msg.role === 'assistant' ? 'Assistant' : 'You'}
                            </span>
                            <div className={`p-3 text-sm leading-relaxed ${msg.role === 'assistant'
                                    ? 'bg-surface-border/30 rounded-lg rounded-tl-none border border-surface-border text-gray-300'
                                    : 'bg-white/5 rounded-lg rounded-tr-none border border-surface-border text-white'
                                }`}>
                                {msg.content}
                            </div>

                            {/* Evidence Chips */}
                            {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {msg.citations.map((cite, idx) => (
                                        <button key={idx} className="flex items-center gap-1 bg-surface-border/60 hover:bg-primary/20 border border-surface-border text-[10px] text-text-muted hover:text-primary px-2 py-1 rounded-full transition-colors" title={`Contract ID: ${cite.contract_id}`}>
                                            <span className="material-symbols-outlined text-[12px]">description</span>
                                            Source: Document
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                            <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-medium text-primary tracking-wider">Assistant</span>
                            <div className="bg-surface-border/30 p-4 rounded-lg rounded-tl-none border border-surface-border flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="pb-2" />
            </div>

            <div className="p-4 border-t border-surface-border bg-surface shrink-0">
                <div className="relative">
                    <input
                        className="w-full bg-background-dark border border-surface-border rounded pl-4 pr-10 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Query your tenant vault..."
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleSend();
                        }}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors p-1 disabled:opacity-30 disabled:hover:text-primary cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </div>
                <p className="text-[10px] text-center text-text-muted mt-2 opacity-50">AI generated insights based on your secured RAG data.</p>
            </div>
        </aside>
    )
}

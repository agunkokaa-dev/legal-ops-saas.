'use client'

import { useState, useRef, useEffect } from 'react'
import { chatWithClause } from '@/app/actions/backend'
import { Sparkles, Command, User, Send, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    citations?: { contract_id: string; file_name?: string }[]
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
        <aside className="flex flex-col w-full h-full overflow-hidden bg-background-dark border-l border-white/10">
            <div className="px-5 py-4 border-b border-surface-border/50">
                <h2 className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">Clause Assistant</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[90%]`}>
                            <div className={`p-4 text-sm leading-relaxed ${msg.role === 'assistant'
                                ? 'bg-surface/50 rounded-2xl border border-surface-border'
                                : 'bg-primary/10 rounded-2xl border border-primary/20 text-white'
                                }`}>
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 [&>p]:mb-2 last:[&>p]:mb-0 [&>ul]:mt-1 [&>ul]:mb-2 [&>li]:my-0.5">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>

                            {/* Evidence Chips */}
                            {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {msg.citations.map((cite, idx) => {
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => console.log('View Source:', cite.contract_id)}
                                                className="flex items-center gap-1.5 bg-surface-border/60 hover:bg-primary/20 border border-surface-border text-[10px] text-text-muted hover:text-primary px-2 py-1 rounded-full transition-colors cursor-pointer"
                                                title={`Contract ID: ${cite.contract_id}`}
                                            >
                                                <FileText className="w-3 h-3" />
                                                Source: {cite.file_name || 'Document'}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex flex-col max-w-[90%]">
                            <div className="bg-surface/50 p-4 rounded-2xl border border-surface-border flex items-center gap-1.5 w-fit">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors p-1 disabled:opacity-30 disabled:hover:text-primary cursor-pointer flex items-center justify-center"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-[10px] text-center text-text-muted mt-2 opacity-50">AI generated insights based on your secured RAG data.</p>
            </div>
        </aside>
    )
}

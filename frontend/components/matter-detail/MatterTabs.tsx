import Link from 'next/link'

export default function MatterTabs({ activeTab = 'overview' }: { activeTab?: string }) {
    return (
        <div className="border-b border-surface-border mb-8">
            <nav aria-label="Tabs" className="flex space-x-8">
                <Link
                    href="?tab=overview"
                    shallow
                    className={`py-4 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-muted hover:border-gray-600 hover:text-gray-200'
                        }`}
                >
                    Overview
                </Link>
                <Link
                    href="?tab=documents"
                    shallow
                    className={`py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'documents'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-muted hover:border-gray-600 hover:text-gray-200'
                        }`}
                >
                    Documents
                </Link>
                <Link
                    href="?tab=genealogy"
                    shallow
                    className={`py-4 px-1 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${activeTab === 'genealogy'
                        ? 'border-primary text-white'
                        : 'border-transparent text-text-muted hover:border-gray-600 hover:text-gray-200'
                        }`}
                >
                    Genealogy
                </Link>
            </nav>
        </div>
    )
}

import Sidebar from '@/components/Sidebar'
import AssistantSidebar from '@/components/AssistantSidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="bg-background-dark text-white min-h-screen flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {children}
            </div>
            <AssistantSidebar />
        </div>
    )
}

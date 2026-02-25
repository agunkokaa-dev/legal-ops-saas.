import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'

export default function Sidebar() {
    return (
        <nav className="w-20 lg:w-64 border-r border-surface-border bg-surface flex flex-col shrink-0 transition-all duration-300">
            <div className="h-16 flex items-center px-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                    <div className="text-primary material-symbols-outlined text-[28px]">gavel</div>
                    <span className="font-display text-xl font-medium tracking-wide hidden lg:block">CLAUSE</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
                <a className="flex items-center gap-3 px-3 py-2 rounded bg-primary/10 border border-primary/20 text-primary group" href="#">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-sm font-medium hidden lg:block">Dashboard</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group" href="#">
                    <span className="material-symbols-outlined">briefcase_meal</span>
                    <span className="text-sm font-medium hidden lg:block">Matters</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group" href="#">
                    <span className="material-symbols-outlined">description</span>
                    <span className="text-sm font-medium hidden lg:block">Documents</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group" href="#">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="text-sm font-medium hidden lg:block">Calendar</span>
                </a>
                <div className="my-2 border-t border-surface-border"></div>
                <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group" href="#">
                    <span className="material-symbols-outlined">analytics</span>
                    <span className="text-sm font-medium hidden lg:block">Analytics</span>
                </a>
                <a className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group" href="#">
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-sm font-medium hidden lg:block">Settings</span>
                </a>
            </div>
            <div className="p-4 border-t border-surface-border hidden lg:flex flex-col gap-4">
                <OrganizationSwitcher hidePersonal={true} />
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded justify-between">
                    <UserButton afterSignOutUrl="/" showName />
                </div>
            </div>
        </nav>
    )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs'

const navItems = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
    { href: '/dashboard/matters', icon: 'briefcase_meal', label: 'Matters', exact: false },
    { href: '/dashboard/documents', icon: 'description', label: 'Documents', exact: false },
    { href: '/dashboard/calendar', icon: 'calendar_month', label: 'Calendar', exact: false },
]

const secondaryItems = [
    { href: '/dashboard/analytics', icon: 'analytics', label: 'Analytics' },
    { href: '/dashboard/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
    const pathname = usePathname()

    const isActive = (href: string, exact: boolean = false) => {
        if (exact) return pathname === href
        return pathname.startsWith(href)
    }

    return (
        <nav className="w-20 lg:w-64 border-r border-surface-border bg-surface flex flex-col shrink-0 transition-all duration-300">
            <div className="h-16 flex items-center px-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                    <div className="text-primary material-symbols-outlined text-[28px]">gavel</div>
                    <span className="font-display text-xl font-medium tracking-wide hidden lg:block">CLAUSE</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
                {navItems.map((item) => {
                    const active = isActive(item.href, item.exact)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                active
                                    ? 'flex items-center gap-3 px-3 py-2 rounded bg-primary/10 border border-primary/20 text-primary group'
                                    : 'flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group'
                            }
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-sm font-medium hidden lg:block">{item.label}</span>
                        </Link>
                    )
                })}
                <div className="my-2 border-t border-surface-border"></div>
                {secondaryItems.map((item) => {
                    const active = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                active
                                    ? 'flex items-center gap-3 px-3 py-2 rounded bg-primary/10 border border-primary/20 text-primary group'
                                    : 'flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors group'
                            }
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-sm font-medium hidden lg:block">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded justify-between">
                <OrganizationSwitcher hidePersonal={true} />
                <div>
                    <UserButton afterSignOutUrl="/" showName />
                </div>
            </div>
        </nav>
    )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sun, Moon, BookOpen, FileText, Layers, TrendingUp, Calendar, GitBranch, Sparkles, FileCheck, Settings } from 'lucide-react'

interface NavItem {
  category: string
  label: string
  icon: string
  href: string
  count?: number
}

interface Stats {
  entities: number
  concepts: number
  sources: number
  summaries: number
}

const categoryColors: Record<string, string> = {
  entity: 'bg-green-500/10 text-green-500',
  concept: 'bg-purple-500/10 text-purple-500',
  source: 'bg-blue-500/10 text-blue-500',
  summary: 'bg-orange-500/10 text-orange-500',
  log: 'bg-slate-500/10 text-slate-400',
  lint: 'bg-pink-500/10 text-pink-500',
}

const navItems: NavItem[] = [
  { category: 'overview', label: 'Overview', icon: 'BookOpen', href: '/' },
  { category: 'entity', label: 'Entities', icon: 'TrendingUp', href: '/?category=entity', count: 0 },
  { category: 'concept', label: 'Concepts', icon: 'Layers', href: '/?category=concept', count: 0 },
  { category: 'source', label: 'Sources', icon: 'FileText', href: '/?category=source', count: 0 },
  { category: 'summary', label: 'Summaries', icon: 'FileCheck', href: '/?category=summary', count: 0 },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [stats, setStats] = useState<Stats>({ entities: 0, concepts: 0, sources: 0, summaries: 0 })
  const [navList, setNavList] = useState<NavItem[]>(navItems)

  useEffect(() => {
    // Load dark mode preference
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) setDarkMode(saved === 'true')

    // Fetch wiki stats
    fetch('/api/index')
      .then(r => r.json())
      .then(data => {
        const s = {
          entities: data.entities?.length || 0,
          concepts: data.concepts?.length || 0,
          sources: data.sources?.length || 0,
          summaries: data.summaries?.length || 0,
        }
        setStats(s)
        setNavList([
          { category: 'overview', label: 'Overview', icon: 'BookOpen', href: '/' },
          { category: 'entity', label: 'Entities', icon: 'TrendingUp', href: '/?category=entity', count: s.entities },
          { category: 'concept', label: 'Concepts', icon: 'Layers', href: '/?category=concept', count: s.concepts },
          { category: 'source', label: 'Sources', icon: 'FileText', href: '/?category=source', count: s.sources },
          { category: 'summary', label: 'Summaries', icon: 'FileCheck', href: '/?category=summary', count: s.summaries },
        ])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href.split('?')[0]) && href !== '/'
  }

  const iconMap: Record<string, any> = {
    BookOpen, FileText, Layers, TrendingUp, Calendar, GitBranch, Sparkles, FileCheck, Settings,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
        border-b border-gray-200 dark:border-gray-800
        flex items-center px-4 gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">LLM Wiki</span>
        </Link>

        <div className="flex-1" />

        {/* Quick nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/ingest', label: 'Ingest', icon: Sparkles },
            { href: '/lint', label: 'Lint', icon: FileCheck },
            { href: '/log', label: 'Log', icon: GitBranch },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${isActive(href)
                  ? 'bg-primary-500/10 text-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 z-40 w-64
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transition-all duration-200 ease-in-out overflow-y-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4">
          <nav className="space-y-1">
            {navList.map(item => {
              const Icon = iconMap[item.icon] || BookOpen
              const colorClass = categoryColors[item.category] || ''
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                    ${isActive(item.href)
                      ? 'bg-primary-500/10 text-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive(item.href) ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'} transition-colors`} />
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colorClass}`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Stats footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Entities', value: stats.entities, color: 'text-green-500' },
                { label: 'Concepts', value: stats.concepts, color: 'text-purple-500' },
                { label: 'Sources', value: stats.sources, color: 'text-blue-500' },
                { label: 'Summaries', value: stats.summaries, color: 'text-orange-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                  <div className={`text-lg font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={`
          pt-14 min-h-screen transition-all duration-200
          ${sidebarOpen ? 'md:pl-64' : ''}
        `}
      >
        <div className="px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

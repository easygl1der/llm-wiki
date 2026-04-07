import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, Home, FileText, ScrollText, PlusCircle, Search, Sparkles, GitBranch, ChevronRight, Menu, X, Moon, Sun, MessageSquare } from 'lucide-react'

interface WikiStats {
  entities: number
  concepts: number
  sources: number
  summaries: number
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<WikiStats>({ entities: 0, concepts: 0, sources: 0, summaries: 0 })
  const [navItems, setNavItems] = useState<{ category: string; count: number; items: Array<{ slug: string; title: string }> }[]>([])
  const location = useLocation()

  useEffect(() => {
    fetch('/api/index')
      .then(r => r.json())
      .then(data => {
        setStats({
          entities: data.entities?.length || 0,
          concepts: data.concepts?.length || 0,
          sources: data.sources?.length || 0,
          summaries: data.summaries?.length || 0
        })
        setNavItems([
          { category: 'Entities', count: data.entities?.length || 0, items: (data.entities || []).slice(0, 10).map((e: any) => ({ slug: e.slug, title: e.title })) },
          { category: 'Concepts', count: data.concepts?.length || 0, items: (data.concepts || []).slice(0, 10).map((e: any) => ({ slug: e.slug, title: e.title })) },
          { category: 'Sources', count: data.sources?.length || 0, items: (data.sources || []).slice(0, 10).map((e: any) => ({ slug: e.slug, title: e.title })) },
          { category: 'Summaries', count: data.summaries?.length || 0, items: (data.summaries || []).slice(0, 10).map((e: any) => ({ slug: e.slug, title: e.title })) },
        ])
      })
      .catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const isActive = (path: string) => location.pathname === path

  const sidebarLinks = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/ingest', icon: PlusCircle, label: 'Ingest' },
    { path: '/query', icon: MessageSquare, label: 'Query' },
    { path: '/lint', icon: Sparkles, label: 'Lint' },
    { path: '/log', icon: ScrollText, label: 'Log' },
  ]

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${darkMode ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:transform-none
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white text-sm">LLM Wiki</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Knowledge Base</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sidebarLinks.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive(path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          <div className="pt-4">
            <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Wiki Structure
            </div>
            {navItems.map(({ category, count, items }) => (
              <div key={category} className="mb-3">
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  {category}
                  <span className="ml-auto bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                    {count}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {items.map(item => (
                    <Link
                      key={item.slug}
                      to={`/wiki/${item.slug}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        block pl-6 pr-3 py-1.5 rounded-md text-xs
                        transition-colors duration-150 truncate
                        ${isActive(`/wiki/${item.slug}`)
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/log"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-500 flex items-center gap-1"
            >
              <GitBranch className="w-3 h-3" />
              View History
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search wiki..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg
                  bg-gray-100 dark:bg-gray-800
                  border border-transparent
                  text-sm text-gray-900 dark:text-white
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                  transition-all duration-150"
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {stats.entities + stats.concepts} pages
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {stats.sources} sources
            </span>
          </div>

          <Link
            to="/ingest"
            className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-primary-500 hover:bg-primary-600
              text-white text-sm font-medium
              transition-colors duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Ingest</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

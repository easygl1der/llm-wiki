'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, FileText, GitBranch, Sparkles, ArrowRight, TrendingUp, Brain, Layers } from 'lucide-react'

interface IndexData {
  entities: Array<{ slug: string; title: string; summary: string }>
  concepts: Array<{ slug: string; title: string; summary: string }>
  sources: Array<{ slug: string; title: string; summary: string }>
  summaries: Array<{ slug: string; title: string; summary: string }>
}

export default function HomePage() {
  const [index, setIndex] = useState<IndexData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/index')
      .then(r => r.json())
      .then((data: IndexData) => { setIndex(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalPages = index
    ? index.entities.length + index.concepts.length + index.sources.length + index.summaries.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-64">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading wiki...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">LLM Wiki</h1>
            <p className="text-gray-500 dark:text-gray-400">Your persistent, compounding knowledge base</p>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
          This wiki is maintained by AI — not just indexed for retrieval, but actively synthesized.
          Every source is integrated, cross-referenced, and kept current. Your knowledge compounds over time.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Pages', value: totalPages, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
          { label: 'Sources', value: index?.sources.length || 0, icon: FileText, color: 'from-purple-500 to-pink-500' },
          { label: 'Concepts', value: index?.concepts.length || 0, icon: Layers, color: 'from-orange-500 to-red-500' },
          { label: 'Entities', value: index?.entities.length || 0, icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Concepts */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-purple-500" />
            Concepts
          </h2>
          <div className="space-y-3">
            {index?.concepts.slice(0, 5).map(item => (
              <Link
                key={item.slug}
                href={`/wiki/${item.slug}`}
                className="block bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800
                  hover:border-primary-500/50 dark:hover:border-primary-500/50
                  transition-colors duration-150 group"
              >
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.summary}</p>
              </Link>
            ))}
            {(!index?.concepts || index.concepts.length === 0) && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No concepts yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Entities */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Entities
          </h2>
          <div className="space-y-3">
            {index?.entities.slice(0, 5).map(item => (
              <Link
                key={item.slug}
                href={`/wiki/${item.slug}`}
                className="block bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800
                  hover:border-primary-500/50 dark:hover:border-primary-500/50
                  transition-colors duration-150 group"
              >
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.summary}</p>
              </Link>
            ))}
            {(!index?.entities || index.entities.length === 0) && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No entities yet</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick actions */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/ingest"
            className="flex items-center gap-4 p-5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl text-white
              hover:from-primary-600 hover:to-primary-700 transition-all duration-150 group"
          >
            <Sparkles className="w-8 h-8" />
            <div>
              <div className="font-semibold">Ingest a Source</div>
              <div className="text-sm text-primary-100">Add new knowledge</div>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/lint"
            className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800
              hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-colors group"
          >
            <Sparkles className="w-8 h-8 text-purple-500" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">Lint Wiki</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Health check & suggestions</div>
            </div>
          </Link>
          <Link
            href="/log"
            className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800
              hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-colors group"
          >
            <GitBranch className="w-8 h-8 text-orange-500" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">View History</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Activity timeline</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {index?.sources.slice(0, 6).map(item => (
            <Link
              key={item.slug}
              href={`/wiki/${item.slug}`}
              className="block bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800
                hover:border-primary-500/50 dark:hover:border-primary-500/50
                transition-colors duration-150 group"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.summary}</p>
                </div>
              </div>
            </Link>
          ))}
          {(!index?.sources || index.sources.length === 0) && (
            <div className="sm:col-span-2 lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl p-8 border border-dashed border-gray-300 dark:border-gray-700 text-center">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No sources ingested yet</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

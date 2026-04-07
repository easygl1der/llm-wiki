import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'

export default function LogPage() {
  const [log, setLog] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/log')
      .then(r => r.text())
      .then(text => { setLog(text); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const entries = log.split(/(?=## \[)/).filter(Boolean)

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.toLowerCase().includes(filter))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-orange-500" />
            Wiki Log
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Chronological record of all wiki activity</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'ingest', 'query', 'lint', 'edit'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border border-dashed border-gray-300 dark:border-gray-700 text-center">
            <ScrollText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'No activity logged yet' : `No ${filter} entries`}
            </p>
          </div>
        )}
        {filtered.map((entry, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
              {entry}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

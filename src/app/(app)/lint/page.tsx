'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react'

export default function LintPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runLint = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/lint', { method: 'POST' })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ issues: [], suggestions: [], error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-purple-500" />
          Wiki Health Check
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Analyze your wiki for contradictions, stale content, orphan pages, and gaps.
        </p>
      </div>

      <button
        onClick={runLint}
        disabled={loading}
        className="mb-8 flex items-center gap-2 px-6 py-3 rounded-lg
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-medium
          hover:from-purple-600 hover:to-pink-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        Run Health Check
      </button>

      {result && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Pages', value: result.stats?.totalPages || 0, color: 'text-green-500' },
              { label: 'Issues', value: result.issues?.length || 0, color: 'text-orange-500' },
              { label: 'Suggestions', value: result.suggestions?.length || 0, color: 'text-blue-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {result.issues?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Issues
              </h2>
              <div className="space-y-2">
                {result.issues.map((issue: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-900/30">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-orange-800 dark:text-orange-300">{issue}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Suggestions */}
          {result.suggestions?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                Suggestions
              </h2>
              <div className="space-y-2">
                {result.suggestions.map((s: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900/30">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-blue-800 dark:text-blue-300">{s}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {result.issues?.length === 0 && result.suggestions?.length === 0 && (
            <div className="flex items-center gap-3 p-6 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30">
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-300">Wiki looks healthy!</div>
                <div className="text-sm text-green-700 dark:text-green-400">No issues or suggestions at this time.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

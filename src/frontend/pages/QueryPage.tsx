import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Loader2, MessageSquare, ExternalLink, BookOpen } from 'lucide-react'

export default function QueryPage() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    answer: string
    citedPages: Array<{ slug: string; title: string }>
    totalRelevant: number
  } | null>(null)
  const [error, setError] = useState('')

  const handleQuery = async () => {
    if (!question.trim()) return
    setLoading(true)
    setResult(null)
    setError('')

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Query failed')
      } else {
        setResult(data)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary-500" />
          Query Wiki
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Ask questions and get synthesized answers from your wiki knowledge base.
        </p>
      </div>

      {/* Question input */}
      <div className="mb-6">
        <div className="relative">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your wiki..."
            rows={3}
            className="w-full px-4 py-3 pr-12 rounded-xl
              bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
              text-gray-900 dark:text-white text-sm
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
              resize-none"
          />
          <button
            onClick={handleQuery}
            disabled={loading || !question.trim()}
            className="absolute right-3 bottom-3 p-2 rounded-lg
              bg-primary-500 hover:bg-primary-600
              text-white disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-right">
          Press Enter to query, Shift+Enter for new line
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Answer */}
      {result && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {result.totalRelevant} relevant page{result.totalRelevant !== 1 ? 's' : ''} found
            </span>
            {result.citedPages.length > 0 && (
              <span>Answer synthesized from {result.citedPages.length} source{result.citedPages.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Answer card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Answer
            </h2>
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
              {result.answer.split('\n\n').map((para, i) => (
                <p key={i} className="mb-3 last:mb-0">{para}</p>
              ))}
            </div>
          </div>

          {/* Cited pages */}
          {result.citedPages.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Cited Pages
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {result.citedPages.map(page => (
                  <Link
                    key={page.slug}
                    to={`/wiki/${page.slug}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg
                      bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                      text-gray-700 dark:text-gray-300 text-sm
                      hover:border-primary-500/50 dark:hover:border-primary-500/50
                      transition-colors group"
                  >
                    <BookOpen className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="group-hover:text-primary-500 transition-colors">{page.title}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-primary-500 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

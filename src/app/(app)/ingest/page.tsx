'use client'

import { useState } from 'react'
import { PlusCircle, FileText, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function IngestPage() {
  const [sourceType, setSourceType] = useState<'text' | 'url'>('text')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('source')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleIngest = async () => {
    if (!content.trim() && !url.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: sourceType,
          content: sourceType === 'url' ? url : content,
          title: title || (sourceType === 'url' ? url : 'Untitled Source'),
          category
        })
      })
      const data = await res.json()
      setResult({ success: res.ok, message: data.message || data.error || 'Done' })
      if (res.ok) {
        setContent('')
        setUrl('')
        setTitle('')
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <PlusCircle className="w-7 h-7 text-primary-500" />
          Ingest Source
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Add a new source to your wiki. The AI will extract key information and integrate it into existing pages.
        </p>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'text', label: 'Text', icon: FileText },
          { value: 'url', label: 'URL', icon: FileText },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSourceType(value as 'text' | 'url')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${sourceType === value
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-primary-500/50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Source title or name"
            className="w-full px-4 py-2.5 rounded-lg
              bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
              text-gray-900 dark:text-white text-sm
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['entity', 'concept', 'source', 'summary'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors
                  ${category === cat
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {sourceType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Content
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              placeholder="Paste article text, notes, or any content here..."
              className="w-full px-4 py-3 rounded-lg
                bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                text-gray-900 dark:text-white text-sm
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                resize-none font-mono"
            />
          </div>
        )}

        {sourceType === 'url' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-lg
                bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
                text-gray-900 dark:text-white text-sm
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>
        )}

        <button
          onClick={handleIngest}
          disabled={loading || (!content.trim() && !url.trim())}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            bg-gradient-to-r from-primary-500 to-primary-600
            text-white font-medium text-sm
            hover:from-primary-600 hover:to-primary-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Ingest Source
            </>
          )}
        </button>

        {result && (
          <div className={`
            flex items-center gap-3 p-4 rounded-lg
            ${result.success
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }
          `}>
            {result.success
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <AlertCircle className="w-5 h-5 shrink-0" />
            }
            <span className="text-sm">{result.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}

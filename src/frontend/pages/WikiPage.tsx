import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Tag, ExternalLink, ChevronRight, FileText, ChevronDown } from 'lucide-react'

interface WikiPage {
  slug: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  sources?: string[]
}

// ===== Markdown AST Node Types =====
type MDNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; id: string }
  | { type: 'paragraph'; children: MDInline[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: MDInline[][] }
  | { type: 'blockquote'; children: MDNode[] }
  | { type: 'hr' }
  | { type: 'html'; raw: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

type MDInline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'wikilink'; text: string; target: string }
  | { type: 'extlink'; text: string; href: string }
  | { type: 'intlink'; text: string; href: string }
  | { type: 'code'; text: string }

// ===== Markdown Parser =====
function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function parseInline(text: string): MDInline[] {
  const result: MDInline[] = []
  let remaining = text

  const patterns: Array<{ regex: RegExp; type: MDInline['type']; extract: (m: RegExpMatchArray) => MDInline }> = [
    [
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/,
      'wikilink',
      m => ({
        type: 'wikilink' as const,
        text: m[2] || m[1],
        target: slugify(m[1])
      })
    ],
    [
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/,
      'extlink',
      m => ({ type: 'extlink' as const, text: m[1], href: m[2] })
    ],
    [
      /\[([^\]]+)\]\(\/([^)]+)\)/,
      'intlink',
      m => ({ type: 'intlink' as const, text: m[1], href: m[2] })
    ],
    [
      /`([^`]+)`/,
      'code',
      m => ({ type: 'code' as const, text: m[1] })
    ],
    [
      /\*\*([^*]+)\*\*/,
      'bold',
      m => ({ type: 'bold' as const, text: m[1] })
    ],
    [
      /\*([^*]+)\*/,
      'italic',
      m => ({ type: 'italic' as const, text: m[1] })
    ],
  ]

  while (remaining.length > 0) {
    let earliest: { index: number; match: RegExpMatchArray; extractor: (m: RegExpMatchArray) => MDInline } | null = null

    for (const { regex, extract } of patterns) {
      const m = remaining.match(regex)
      if (m && m.index !== undefined && (!earliest || m.index < earliest.index)) {
        earliest = { index: m.index, match: m, extractor }
      }
    }

    if (earliest) {
      if (earliest.index > 0) {
        result.push({ type: 'text', text: remaining.substring(0, earliest.index) })
      }
      result.push(earliest.extractor(earliest.match))
      remaining = remaining.substring(earliest.index + earliest.match[0].length)
    } else {
      result.push({ type: 'text', text: remaining })
      break
    }
  }

  return result
}

function parseMarkdown(content: string): MDNode[] {
  // Strip Obsidian HTML comments and collapse marker text
  content = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^▶\s*/gm, '')
    .replace(/^▼\s*/gm, '')

  const lines = content.split('\n')
  const nodes: MDNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2].trim(),
        id: slugify(headingMatch[2])
      })
      i++; continue
    }

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      nodes.push({ type: 'code', lang, code: codeLines.join('\n') })
      i++; continue
    }

    // HR
    if (line.trim() === '---') {
      nodes.push({ type: 'hr' })
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [line.slice(2)]
      i++
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      nodes.push({ type: 'blockquote', children: [{ type: 'paragraph', children: parseInline(quoteLines.join(' ')) }] })
      continue
    }

    // List
    if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
      const items: MDInline[][] = []
      while (i < lines.length && (lines[i].match(/^[-*]\s/) || lines[i].match(/^\d+\.\s/))) {
        const ordered = !!lines[i].match(/^\d+\.\s/)
        const text = lines[i].replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '')
        items.push(parseInline(text))
        i++
      }
      nodes.push({ type: 'list', ordered, items })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++; continue
    }

    // Table
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      // Parse table
      const rows = tableLines
        .filter(l => !l.match(/^\|[-:\s|]+\|$/)) // skip separator row
        .map(row => row.split('|').filter(c => c !== '').map(c => c.trim()))

      const headers = rows[0] || []
      const dataRows = rows.slice(1)

      nodes.push({ type: 'table', headers, rows: dataRows })
      continue
    }

    // HTML block (for <details> tags from Obsidian exports)
    if (line.trim().startsWith('<details') || line.trim().startsWith('<summary') || line.trim().startsWith('</details') || line.trim().startsWith('</summary') || line.trim() === '<summary' || line.startsWith('<div') || line.startsWith('</div') || line.trim() === '<br') {
      let htmlBlock = line + '\n'
      i++
      while (i < lines.length && !lines[i].trim().startsWith('</details') && !lines[i].trim().startsWith('</summary') && !lines[i].trim().startsWith('<details') && !lines[i].trim().startsWith('<summary') && lines[i].trim() !== '</details>') {
        htmlBlock += lines[i] + '\n'
        i++
      }
      if (i < lines.length) htmlBlock += lines[i] + '\n'
      i++
      nodes.push({ type: 'html', raw: htmlBlock.trim() })
      continue
    }

    // Paragraph
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^(#{1,6})\s/) && !lines[i].startsWith('```') && !lines[i].startsWith('<!--') && !lines[i].trim().startsWith('<details') && !lines[i].trim().startsWith('<summary') && !lines[i].trim().startsWith('</details')) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      nodes.push({ type: 'paragraph', children: parseInline(paraLines.join(' ')) })
    }
  }

  return nodes
}

// ===== Inline Renderer =====
function Inline({ node }: { node: MDInline }) {
  switch (node.type) {
    case 'text': return <>{node.text}</>
    case 'bold': return <strong className="font-semibold">{node.text}</strong>
    case 'italic': return <em>{node.text}</em>
    case 'wikilink':
      return (
        <Link
          to={`/wiki/${node.target}`}
          className="text-primary-500 hover:text-primary-400 underline decoration-dotted underline-offset-2 transition-colors"
        >
          {node.text}
        </Link>
      )
    case 'extlink':
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-500 hover:text-primary-400 inline-flex items-center gap-0.5 transition-colors"
        >
          {node.text}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      )
    case 'intlink':
      return (
        <Link
          to={node.href}
          className="text-primary-500 hover:text-primary-400 underline decoration-dotted underline-offset-2 transition-colors"
        >
          {node.text}
        </Link>
      )
    case 'code':
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-primary-600 dark:text-primary-400">
          {node.text}
        </code>
      )
  }
}

// ===== Block Renderer =====
function MDNode({ node }: { node: MDNode }) {
  switch (node.type) {
    case 'heading': {
      const Tag = `h${node.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      const classes: Record<number, string> = {
        1: 'text-2xl font-bold text-gray-900 dark:text-white mb-6',
        2: 'text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4',
        3: 'text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3',
        4: 'text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2',
        5: 'text-sm font-semibold text-gray-900 dark:text-white mt-4 mb-2',
        6: 'text-sm font-medium text-gray-900 dark:text-white mt-4 mb-2',
      }
      return (
        <Tag id={node.id} className={classes[node.level]}>
          {node.text}
        </Tag>
      )
    }
    case 'paragraph':
      return (
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {node.children.map((child, i) => <Inline key={i} node={child} />)}
        </p>
      )
    case 'code':
      return (
        <pre className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
          <code className="text-sm text-gray-100 font-mono whitespace-pre">{node.code}</code>
        </pre>
      )
    case 'list':
      const ListTag = node.ordered ? 'ol' : 'ul'
      return (
        <ListTag className={`ml-6 mb-4 space-y-1 ${node.ordered ? 'list-decimal' : 'list-disc'} text-gray-700 dark:text-gray-300`}>
          {node.items.map((item, i) => (
            <li key={i}>
              {item.map((child, j) => <Inline key={j} node={child} />)}
            </li>
          ))}
        </ListTag>
      )
    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-primary-500 pl-4 my-4 text-gray-600 dark:text-gray-400 italic">
          {node.children.map((child, i) => <MDNode key={i} node={child} />)}
        </blockquote>
      )
    case 'hr':
      return <hr className="border-gray-200 dark:border-gray-800 my-8" />
    case 'html':
      // Handle <details>/<summary> collapsible sections from Obsidian
      return <ObsidianDetails html={node.raw} />
    case 'table':
      return (
        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                {node.headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {node.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {cell.split('**').map((part, pi) =>
                        pi % 2 === 1 ? <strong key={pi} className="font-semibold">{part}</strong> : part
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

// ===== Obsidian Collapsible Details =====
function ObsidianDetails({ html }: { html: string }) {
  // Parse <details><summary>...</summary>...content...</details>
  const summaryMatch = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)
  const summaryText = summaryMatch
    ? summaryMatch[1].replace(/<[^>]+>/g, '').trim()
    : ''
  const isInitiallyOpen = html.includes('<details open')

  if (!summaryText) {
    // Fallback: render raw HTML
    return <div className="my-2" dangerouslySetInnerHTML={{ __html: html }} />
  }

  // Simple native details element with CSS-controlled arrow
  return (
    <details className="obsidian-collapse my-4 rounded-lg border border-gray-200 dark:border-gray-800" open={isInitiallyOpen}>
      <summary
        className="obsidian-summary flex items-center gap-2 px-4 py-3 cursor-pointer
          bg-gray-50 dark:bg-gray-900/50
          text-gray-900 dark:text-white font-medium text-sm
          hover:bg-gray-100 dark:hover:bg-gray-900
          rounded-t-lg select-none"
      >
        <span className="collapse-arrow text-gray-400 transition-transform duration-200">
          <ChevronDown className="w-4 h-4" />
        </span>
        {summaryText}
      </summary>
      <div
        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed
          bg-white dark:bg-gray-950 rounded-b-lg border-t border-gray-200 dark:border-gray-800
          [&_a]:text-primary-500 [&_a:hover]:text-primary-400 [&_a]:underline"
        dangerouslySetInnerHTML={{
          __html: html
            .replace(/<\/?details[^>]*>/g, '')
            .replace(/<summary[^>]*>[\s\S]*?<\/summary>/g, '')
            .trim()
        }}
      />
    </details>
  )
}

// ===== Main WikiPage Component =====
export default function WikiPage() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState<WikiPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setPage(null)
    fetch(`/api/wiki/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Page not found')
        return r.json()
      })
      .then(data => { setPage(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [slug])

  const nodes = useCallback(() => {
    if (!page) return []
    return parseMarkdown(page.content)
  }, [page?.content])

  const categoryColors: Record<string, string> = {
    entity: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    concept: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    source: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    summary: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    overview: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    log: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          This page doesn't exist yet. It will be created when you ingest relevant sources.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="capitalize text-gray-900 dark:text-white">{page.category}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white">{page.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[page.category] || categoryColors.overview}`}>
            {page.category}
          </span>
          {page.tags?.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{page.title}</h1>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Updated {new Date(page.updatedAt).toLocaleDateString()}
          </span>
          {page.sources && page.sources.length > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {page.sources.length} source{page.sources.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <article className="prose dark:prose-invert max-w-none">
        {nodes().map((node, i) => <MDNode key={i} node={node} />)}
      </article>

      {/* Footer nav */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}

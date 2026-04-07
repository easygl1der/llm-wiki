import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { listPages, getPage, savePage, buildIndex } from '../lib/wiki.js'
import { appendLog, getLog } from '../lib/log.js'
import { analyzeContent, answerQuestion } from '../lib/llm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ======================
// Utility
// ======================

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LLM-Wiki/1.0 (contact@example.com)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(15000)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // Simple HTML to text extraction
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000)
  } catch {
    throw new Error(`Failed to fetch URL: ${url}`)
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function updateIndexFile(): Promise<void> {
  const fs = await import('fs/promises')
  const index = await buildIndex()
  const indexPath = path.join(process.cwd(), 'src', 'wiki', 'index.md')

  let content = `# Wiki Index\n\n## Overview\n\nThis wiki contains ${index.entities.length} entities, ${index.concepts.length} concepts, ${index.sources.length} sources, and ${index.summaries.length} summaries.\n\n## Entities\n\n`
  for (const e of index.entities) {
    content += `- [[${e.title}]] — ${e.summary}\n`
  }
  content += `\n## Concepts\n\n`
  for (const c of index.concepts) {
    content += `- [[${c.title}]] — ${c.summary}\n`
  }
  content += `\n## Sources\n\n`
  for (const s of index.sources) {
    content += `- [[${s.title}]] — ${s.summary}\n`
  }
  content += `\n## Summaries\n\n`
  for (const s of index.summaries) {
    content += `- [[${s.title}]] — ${s.summary}\n`
  }

  await fs.writeFile(indexPath, content, 'utf-8')
}

// ======================
// API Routes
// ======================

// GET /api/index
app.get('/api/index', async (req, res) => {
  try {
    const index = await buildIndex()
    res.json(index)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/wiki
app.get('/api/wiki', async (req, res) => {
  try {
    const pages = await listPages()
    res.json(pages)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/wiki/:slug
app.get('/api/wiki/:slug', async (req, res) => {
  try {
    const page = await getPage(req.params.slug)
    if (!page) {
      return res.status(404).json({ error: 'Page not found' })
    }
    res.json(page)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/wiki/:slug
app.post('/api/wiki/:slug', async (req, res) => {
  try {
    const { title, content, category, tags, sources } = req.body
    await savePage({
      slug: req.params.slug,
      title: title || req.params.slug,
      content: content || '',
      category: category || 'concept',
      tags: tags || [],
      createdAt: new Date().toISOString(),
      sources: sources || []
    })

    await appendLog({
      type: 'edit',
      title: title || req.params.slug,
      description: `Updated wiki page: ${title || req.params.slug}`
    })

    await updateIndexFile()
    res.json({ success: true, message: 'Page saved' })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/ingest
app.post('/api/ingest', async (req, res) => {
  try {
    const { type, content: rawContent, title, category } = req.body

    if (!rawContent && !title) {
      return res.status(400).json({ error: 'Content or title required' })
    }

    const sourceType = type || 'text'

    // Fetch URL content if needed
    let content = rawContent || ''
    let resolvedTitle = title || 'Untitled'
    if (sourceType === 'url' && rawContent) {
      try {
        content = await fetchUrlContent(rawContent)
        if (!title) {
          // Try to extract title from URL
          const urlTitle = rawContent.split('/').pop()?.replace(/-/g, ' ').replace(/_/g, ' ') || 'Untitled'
          resolvedTitle = urlTitle.charAt(0).toUpperCase() + urlTitle.slice(1)
        }
      } catch (urlError: any) {
        return res.status(400).json({ error: `Failed to fetch URL: ${urlError.message}` })
      }
    }

    const slug = slugify(resolvedTitle)

    // Get existing slugs for cross-referencing
    const existingPages = await listPages()
    const existingSlugs = existingPages.map(p => p.slug)

    // Analyze with LLM
    const analysis = await analyzeContent(content, resolvedTitle, existingSlugs)

    // Build source page content
    const pageContent = buildSourcePage(analysis, sourceType, resolvedTitle, content.substring(0, 5000))

    await savePage({
      slug,
      title: analysis.title,
      content: pageContent,
      category: category || 'source',
      tags: analysis.tags,
      createdAt: new Date().toISOString(),
      sources: [slug]
    })

    // Create entity pages
    for (const entity of analysis.entities.slice(0, 3)) {
      const entitySlug = slugify(entity.name)
      const entityContent = `## Summary\n\n${entity.description}\n\n## Notes\n\nExtracted from: [[${analysis.title}]]\n`
      try {
        await savePage({
          slug: entitySlug,
          title: entity.name,
          content: entityContent,
          category: 'entity',
          tags: ['extracted', entity.type || 'entity'],
          createdAt: new Date().toISOString(),
          sources: [slug]
        })
      } catch {
        // Entity may already exist, skip
      }
    }

    // Create concept pages
    for (const concept of analysis.concepts.slice(0, 2)) {
      const conceptSlug = slugify(concept.name)
      const relatedLinks = concept.connections.map(c => `[[${c}]]`).join(' ')
      const conceptContent = `## Summary\n\n${concept.description}\n\n## Related\n\n${relatedLinks}\n\n## Notes\n\nExtracted from: [[${analysis.title}]]\n`
      try {
        await savePage({
          slug: conceptSlug,
          title: concept.name,
          content: conceptContent,
          category: 'concept',
          tags: ['extracted'],
          createdAt: new Date().toISOString(),
          sources: [slug]
        })
      } catch {
        // Concept may already exist, skip
      }
    }

    await updateIndexFile()

    await appendLog({
      type: 'ingest',
      title: analysis.title,
      description: `Ingested ${sourceType}: "${analysis.title}". Extracted ${analysis.entities.length} entities, ${analysis.concepts.length} concepts.`
    })

    res.json({
      success: true,
      message: `Source "${analysis.title}" ingested with LLM analysis`,
      slug,
      analysis: {
        entities: analysis.entities.map(e => e.name),
        concepts: analysis.concepts.map(c => c.name),
        keyPoints: analysis.keyPoints.length
      }
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

function buildSourcePage(
  analysis: Awaited<ReturnType<typeof analyzeContent>>,
  sourceType: string,
  title: string,
  excerpt: string
): string {
  const relatedLinks = analysis.relatedSlugs
    .filter(Boolean)
    .map(s => `[[${s.replace(/-/g, ' ')}]]`)
    .join(' ')

  const keyPointsMd = analysis.keyPoints.map(p => `- ${p}`).join('\n')

  return `## Summary\n\n${analysis.summary}\n\n## Key Points\n\n${keyPointsMd}\n\n## Related Concepts\n\n${relatedLinks || 'N/A'}\n\n## Notes\n\nSource type: ${sourceType}\nExtracted from: ${title}\n`
}

// POST /api/query
app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body
    if (!question) {
      return res.status(400).json({ error: 'Question required' })
    }

    // Get all pages for context
    const pages = await listPages()
    const searchTerms = question.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2)

    // Score pages by relevance
    const scored = pages.map(p => {
      const text = `${p.title} ${p.content}`.toLowerCase()
      const score = searchTerms.reduce((acc: number, term: string) => {
        return acc + (text.includes(term) ? 1 : 0)
      }, 0)
      return { page: p, score }
    })

    const relevant = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.page)

    // Synthesize answer with LLM
    const result = await answerQuestion(
      question,
      relevant.map(p => ({ slug: p.slug, title: p.title, content: p.content }))
    )

    await appendLog({
      type: 'query',
      title: question.substring(0, 50),
      description: `Query: "${question}". Answered using ${result.citedPages.length} page(s).`
    })

    res.json({
      question,
      answer: result.answer,
      citedPages: result.citedPages,
      totalRelevant: relevant.length
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/lint
app.post('/api/lint', async (req, res) => {
  try {
    const pages = await listPages()
    const issues: string[] = []
    const suggestions: string[] = []

    // Orphan pages (no inbound links, and other pages exist)
    const orphans = pages.filter(p => {
      const links = p.content.match(/\[\[([^\]]+)\]\]/g) || []
      return links.length === 0 && pages.length > 3
    })
    if (orphans.length > 0) {
      issues.push(`${orphans.length} page(s) have no wiki links: ${orphans.map(o => o.title).join(', ')}`)
    }

    // Empty or near-empty pages
    const empty = pages.filter(p => p.content.trim().length < 50)
    if (empty.length > 0) {
      suggestions.push(`${empty.length} page(s) have very little content: ${empty.map(e => e.title).join(', ')}`)
    }

    // Missing categories
    const categories = ['entity', 'concept', 'source', 'summary']
    for (const cat of categories) {
      const count = pages.filter(p => p.category === cat).length
      if (count === 0) {
        suggestions.push(`No ${cat} pages yet. Consider adding some ${cat} pages.`)
      }
    }

    // Duplicate titles
    const titles = pages.map(p => p.title.toLowerCase())
    const dupes = titles.filter((t: string, i: number) => titles.indexOf(t) !== i)
    if (dupes.length > 0) {
      issues.push(`Duplicate page titles found: ${[...new Set(dupes)].join(', ')}`)
    }

    // Cross-reference suggestions
    if (pages.length >= 5) {
      const noXref = pages.filter(p => !p.content.includes('[['))
      if (noXref.length > pages.length / 2) {
        suggestions.push(`${noXref.length} pages lack wiki cross-references. Add [[links]] to connect related content.`)
      }
    }

    if (pages.length > 20) {
      suggestions.push('Wiki is growing well! Consider running lint weekly to maintain quality.')
    }

    await appendLog({
      type: 'lint',
      title: `Health Check — ${pages.length} pages`,
      description: `Lint found ${issues.length} issues and ${suggestions.length} suggestions`
    })

    res.json({
      stats: {
        totalPages: pages.length,
        entities: pages.filter(p => p.category === 'entity').length,
        concepts: pages.filter(p => p.category === 'concept').length,
        sources: pages.filter(p => p.category === 'source').length,
        summaries: pages.filter(p => p.category === 'summary').length,
      },
      issues,
      suggestions
    })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/log
app.get('/api/log', async (req, res) => {
  try {
    const log = await getLog()
    res.type('text/markdown').send(log)
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

// ======================
// Start server
// ======================
app.listen(PORT, () => {
  console.log(`LLM Wiki API server running on http://localhost:${PORT}`)
})

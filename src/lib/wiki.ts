import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export interface WikiPage {
  slug: string
  title: string
  content: string
  category: 'entity' | 'concept' | 'source' | 'summary' | 'log' | 'overview'
  tags: string[]
  createdAt: string
  updatedAt: string
  sources?: string[]
}

export interface WikiIndex {
  entities: Array<{ slug: string; title: string; summary: string }>
  concepts: Array<{ slug: string; title: string; summary: string }>
  sources: Array<{ slug: string; title: string; summary: string }>
  summaries: Array<{ slug: string; title: string; summary: string }>
}

const WIKI_DIR = path.join(process.cwd(), 'src', 'wiki')

export async function getWikiDir(): Promise<string> {
  const dir = WIKI_DIR
  for (const sub of ['entities', 'concepts', 'sources', 'summaries', 'logs']) {
    await fs.mkdir(path.join(dir, sub), { recursive: true })
  }
  await fs.mkdir(path.join(dir, 'raw'), { recursive: true })
  return dir
}

export async function listPages(category?: string): Promise<WikiPage[]> {
  await getWikiDir()
  const categories = category ? [category] : ['entities', 'concepts', 'sources', 'summaries', 'logs']
  const pages: WikiPage[] = []

  for (const cat of categories) {
    const dir = path.join(WIKI_DIR, cat)
    try {
      const files = await fs.readdir(dir)
      for (const file of files) {
        if (file.endsWith('.md')) {
          const content = await fs.readFile(path.join(dir, file), 'utf-8')
          const { data, content: body } = matter(content)
          pages.push({
            slug: file.replace('.md', ''),
            title: data.title || file.replace('.md', ''),
            content: body,
            category: data.category || cat.replace(/s$/, '') as WikiPage['category'],
            tags: data.tags || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            sources: data.sources || []
          })
        }
      }
    } catch {
      // Directory doesn't exist yet
    }
  }
  return pages
}

export async function getPage(slug: string): Promise<WikiPage | null> {
  await getWikiDir()
  const categories = ['entities', 'concepts', 'sources', 'summaries', 'logs']

  for (const cat of categories) {
    const filePath = path.join(WIKI_DIR, cat, `${slug}.md`)
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const { data, content: body } = matter(content)
      return {
        slug,
        title: data.title || slug,
        content: body,
        category: data.category || cat.replace(/s$/, '') as WikiPage['category'],
        tags: data.tags || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        sources: data.sources || []
      }
    } catch {
      continue
    }
  }
  return null
}

export async function savePage(page: Omit<WikiPage, 'updatedAt'>): Promise<void> {
  await getWikiDir()
  const catDir = path.join(WIKI_DIR, page.category + 's')
  await fs.mkdir(catDir, { recursive: true })

  const filePath = path.join(catDir, `${page.slug}.md`)
  const existing = await getPage(page.slug)

  const frontmatter = matter.stringify(page.content, {
    title: page.title,
    category: page.category,
    tags: page.tags,
    createdAt: existing?.createdAt || page.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sources: page.sources || []
  })

  await fs.writeFile(filePath, frontmatter, 'utf-8')
}

export async function buildIndex(): Promise<WikiIndex> {
  const pages = await listPages()
  const index: WikiIndex = {
    entities: [],
    concepts: [],
    sources: [],
    summaries: []
  }

  for (const page of pages) {
    const entry = {
      slug: page.slug,
      title: page.title,
      summary: page.content.split('\n')[0].replace(/^#+\s*/, '').substring(0, 100)
    }

    if (page.category === 'entity') index.entities.push(entry)
    else if (page.category === 'concept') index.concepts.push(entry)
    else if (page.category === 'source') index.sources.push(entry)
    else if (page.category === 'summary') index.summaries.push(entry)
  }

  return index
}

import { marked } from 'marked'
import matter from 'gray-matter'

// Configure marked for wiki use
marked.setOptions({
  gfm: true,
  breaks: true
})

// Extract [[wiki links]] and convert to internal links
function processWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_, text) => {
    const slug = text.toLowerCase().replace(/\s+/g, '-')
    return `[${text}](/wiki/${slug})`
  })
}

export async function parseMarkdown(content: string): Promise<string> {
  const processed = processWikiLinks(content)
  return marked.parse(processed) as string
}

export function extractFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const result = matter(content)
  return { data: result.data as Record<string, unknown>, content: result.content }
}

export function extractHeadings(content: string): Array<{ level: number; text: string; slug: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Array<{ level: number; text: string; slug: string }> = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      slug: match[2].trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    })
  }

  return headings
}

export function extractLinks(content: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    if (match[2].startsWith('/wiki/')) {
      links.push(match[2].replace('/wiki/', ''))
    }
  }

  return [...new Set(links)]
}

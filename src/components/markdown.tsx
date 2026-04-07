// Markdown AST Node Types
export type MDNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; id: string }
  | { type: 'paragraph'; children: MDInline[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: MDInline[][] }
  | { type: 'blockquote'; children: MDNode[] }
  | { type: 'hr' }
  | { type: 'html'; raw: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

export type MDInline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'wikilink'; text: string; target: string }
  | { type: 'extlink'; text: string; href: string }
  | { type: 'intlink'; text: string; href: string }
  | { type: 'code'; text: string }

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function parseInline(text: string): MDInline[] {
  const result: MDInline[] = []
  let remaining = text

  const patterns: Array<[RegExp, (m: RegExpMatchArray) => MDInline]> = [
    [/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/, m => ({
      type: 'wikilink' as const,
      text: (m[2] || m[1]) as string,
      target: slugify(m[1])
    })],
    [/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/, m => ({ type: 'extlink' as const, text: m[1], href: m[2] })],
    [/\[([^\]]+)\]\(\/([^)]+)\)/, m => ({ type: 'intlink' as const, text: m[1], href: m[2] })],
    [/`([^`]+)`/, m => ({ type: 'code' as const, text: m[1] })],
    [/\*\*([^*]+)\*\*/, m => ({ type: 'bold' as const, text: m[1] })],
    [/\*([^*]+)\*/, m => ({ type: 'italic' as const, text: m[1] })],
  ]

  while (remaining.length > 0) {
    let earliest: { index: number; match: RegExpMatchArray; extractor: (m: RegExpMatchArray) => MDInline } | null = null

    for (const [regex, extractor] of patterns) {
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

export function parseMarkdown(content: string): MDNode[] {
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
      let ordered = false
      while (i < lines.length && (lines[i].match(/^[-*]\s/) || lines[i].match(/^\d+\.\s/))) {
        ordered = !!lines[i].match(/^\d+\.\s/)
        const text = lines[i].replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '')
        items.push(parseInline(text))
        i++
      }
      nodes.push({ type: 'list', ordered, items })
      continue
    }

    // Table
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines
        .filter(l => !l.match(/^\|[-:\s|]+\|$/))
        .map(row => row.split('|').filter(c => c !== '').map(c => c.trim()))
      const headers = rows[0] || []
      const dataRows = rows.slice(1)
      nodes.push({ type: 'table', headers, rows: dataRows })
      continue
    }

    // HTML block (Obsidian collapse)
    if (line.trim().startsWith('<details') || line.trim().startsWith('<summary') || line.trim() === '<summary' || line.startsWith('<div') || line.startsWith('</div') || line.trim() === '<br') {
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

    // Empty line
    if (line.trim() === '') {
      i++; continue
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

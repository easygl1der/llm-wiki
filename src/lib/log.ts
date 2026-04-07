import fs from 'fs/promises'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'src', 'wiki', 'logs', 'log.md')

export type LogEntryType = 'ingest' | 'query' | 'lint' | 'edit' | 'note'

export interface LogEntry {
  type: LogEntryType
  title: string
  description: string
  timestamp: string
  tags?: string[]
}

export async function appendLog(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  const date = new Date().toISOString().split('T')[0]
  const time = new Date().toISOString().split('T')[1].substring(0, 8)

  let log = ''
  try {
    log = await fs.readFile(LOG_FILE, 'utf-8')
  } catch {
    log = '# Wiki Log\n\nA chronological record of wiki activity.\n\n'
  }

  const icons: Record<LogEntryType, string> = {
    ingest: '📥',
    query: '❓',
    lint: '🔍',
    edit: '✏️',
    note: '📝'
  }

  const entryStr = `\n## [${date}] ${icons[entry.type]} ${entry.type.toUpperCase()} | ${entry.title}\n\n${entry.description}\n`

  await fs.writeFile(LOG_FILE, log + entryStr, 'utf-8')
}

export async function getLog(limit = 50): Promise<string> {
  try {
    return await fs.readFile(LOG_FILE, 'utf-8')
  } catch {
    return '# Wiki Log\n\nNo activity yet.\n'
  }
}

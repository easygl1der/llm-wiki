const API_BASE = '/api'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export interface WikiIndex {
  entities: Array<{ slug: string; title: string; summary: string }>
  concepts: Array<{ slug: string; title: string; summary: string }>
  sources: Array<{ slug: string; title: string; summary: string }>
  summaries: Array<{ slug: string; title: string; summary: string }>
}

export interface WikiPage {
  slug: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  sources?: string[]
}

export interface IngestRequest {
  type: string
  content: string
  title: string
  category: string
}

export interface IngestResult {
  success: boolean
  message: string
  slug: string
  analysis?: {
    entities: string[]
    concepts: string[]
    keyPoints: number
  }
}

export interface QueryResult {
  question: string
  answer: string
  citedPages: Array<{ slug: string; title: string }>
  totalRelevant: number
}

export interface LintResult {
  stats: {
    totalPages: number
    entities: number
    concepts: number
    sources: number
    summaries: number
  }
  issues: string[]
  suggestions: string[]
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
    const contentType = res.headers.get('content-type')
    if (contentType?.includes('text/markdown')) {
      return { data: await res.text() as unknown as T }
    }
    const data = await res.json()
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` }
    return { data }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Request failed' }
  }
}

export const api = {
  // Wiki index
  index: () => request<WikiIndex>('/index'),

  // Wiki pages
  pages: () => request<WikiPage[]>('/wiki'),
  page: (slug: string) => request<WikiPage>(`/wiki/${encodeURIComponent(slug)}`),

  // Save/create wiki page
  savePage: (slug: string, data: Partial<WikiPage>) =>
    request<{ success: boolean; message: string }>(`/wiki/${encodeURIComponent(slug)}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Ingest a new source
  ingest: (data: IngestRequest) =>
    request<IngestResult>('/ingest', { method: 'POST', body: JSON.stringify(data) }),

  // Query the wiki with a question
  query: (question: string) =>
    request<QueryResult>('/query', { method: 'POST', body: JSON.stringify({ question }) }),

  // Lint/health check
  lint: () => request<LintResult>('/lint', { method: 'POST' }),

  // Wiki log
  log: () => request<string>('/log'),
}

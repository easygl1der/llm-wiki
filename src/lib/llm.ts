import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const MODEL = 'claude-sonnet-4-20250514'

export interface ExtractedEntity {
  name: string
  description: string
  type?: string
}

export interface ExtractedConcept {
  name: string
  description: string
  connections: string[]
}

export interface AnalysisResult {
  title: string
  summary: string
  keyPoints: string[]
  entities: ExtractedEntity[]
  concepts: ExtractedConcept[]
  tags: string[]
  relatedSlugs: string[]
}

const SYSTEM_PROMPT = `You are a knowledge management assistant. You analyze source content and extract structured information for a wiki. Be concise and precise. Always respond with valid JSON only.`

export async function analyzeContent(
  content: string,
  title: string,
  existingSlugs: string[] = []
): Promise<AnalysisResult> {
  const existingContext = existingSlugs.length > 0
    ? `Existing wiki pages (for cross-referencing): ${existingSlugs.join(', ')}`
    : 'No existing wiki pages yet.'

  const userPrompt = `Analyze the following source content and extract structured information.

Title: ${title}

Content:
${content.substring(0, 8000)}

${existingContext}

Respond with a JSON object containing:
{
  "title": "refined title (max 80 chars)",
  "summary": "2-3 sentence summary of the content",
  "keyPoints": ["key insight 1", "key insight 2", "key insight 3"],
  "entities": [{"name": "entity name", "description": "brief description", "type": "person|place|organization|technology|concept"}],
  "concepts": [{"name": "concept name", "description": "brief description", "connections": ["related concept or entity name"]}],
  "tags": ["tag1", "tag2", "tag3"],
  "relatedSlugs": ["slug-of-related-page", ...]
}

Only include entities and concepts that are explicitly mentioned in the content. Max 5 entities, max 3 concepts. relatedSlugs should match existing page slugs (use kebab-case from names).`

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim()
    const parsed = JSON.parse(cleaned) as AnalysisResult

    // Ensure array fields exist
    return {
      title: parsed.title || title,
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      entities: parsed.entities || [],
      concepts: parsed.concepts || [],
      tags: parsed.tags || [],
      relatedSlugs: parsed.relatedSlugs || []
    }
  } catch (e) {
    // Fallback: return minimal structured data
    return {
      title,
      summary: content.substring(0, 200).replace(/^#+\s+/gm, '').split('\n')[0] || '',
      keyPoints: [],
      entities: [],
      concepts: [],
      tags: [],
      relatedSlugs: []
    }
  }
}

export interface QueryResult {
  answer: string
  citedPages: Array<{ slug: string; title: string }>
}

export async function answerQuestion(
  question: string,
  relevantContent: Array<{ slug: string; title: string; content: string }>
): Promise<QueryResult> {
  if (relevantContent.length === 0) {
    return {
      answer: 'No relevant pages found in the wiki. Try ingesting some sources first.',
      citedPages: []
    }
  }

  const context = relevantContent
    .map(p => `--- ${p.title} ---\n${p.content.substring(0, 2000)}`)
    .join('\n\n')

  const userPrompt = `Answer the user's question based on the wiki content provided below.

Question: ${question}

Wiki Content:
${context}

Respond with a JSON object:
{
  "answer": "your synthesized answer in 2-4 paragraphs",
  "citedPages": [{"slug": "page-slug", "title": "Page Title"}, ...]
}

Only cite pages that are actually relevant to the question.`

  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: 'You are a knowledgeable assistant answering questions about a wiki. Synthesize information from the provided content and cite your sources.',
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim()
    const parsed = JSON.parse(cleaned) as QueryResult
    return parsed
  } catch (e) {
    return {
      answer: 'Failed to generate answer. Please try again.',
      citedPages: relevantContent.map(p => ({ slug: p.slug, title: p.title }))
    }
  }
}

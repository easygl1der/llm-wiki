# LLM Wiki

> A persistent, compounding knowledge base maintained by AI.

Inspired by Andrej Karpathy's idea of using language models as wiki curators — not just retrievers, but active compilers of persistent, cross-referenced knowledge that grows and improves over time.

## Background

Most LLM applications use **RAG** (Retrieval-Augmented Generation): at query time, retrieve relevant documents, stuff them into context, generate an answer. RAG is fast and scalable, but:

- Knowledge is re-derived per query — no accumulation
- Cross-references found at query time, not pre-established
- Contradictions easily missed
- Shallow synthesis, no persistent understanding

**LLM Wiki** takes a different approach: compile knowledge into a structured wiki, one page at a time. The LLM reads sources, writes pages, links concepts, flags contradictions, and updates over time. Knowledge compounds. The wiki becomes a model of what you know.

This is the architecture Karpathy described: an LLM that operates on a persistent knowledge base, not just a retrieval index.

## How to Use

### 1. Ingest a Source

Go to **Ingest** and paste any content — article text, URL, notes, paper excerpts. The AI will:

1. Extract key entities, concepts, and claims
2. Classify into Entity / Concept / Source / Summary
3. Create or update wiki pages
4. Add cross-references to existing pages
5. Append a log entry

**Local dev** (`npm run dev`) required for ingest — Vercel deploys have ephemeral filesystem.

### 2. Browse the Wiki

All pages are listed on the home page by category. Click any page to read it. Pages render:

- **Tables** — GFM table syntax
- **Collapsible sections** — Obsidian details blocks
- **Wiki links** — double-bracket links navigate internally
- **External links** — open in new tab

### 3. Browse by Category

Use the sidebar to filter:
- **Entities** — People, places, organizations, specific things
- **Concepts** — Abstract ideas, theories, frameworks, patterns
- **Sources** — Summary pages for ingested content
- **Summaries** — High-level synthesis across multiple sources

### 4. Lint

Run **Lint** to health-check the wiki:
- Find orphan pages (no inbound links)
- Detect broken wiki links
- Flag stale or outdated content
- Identify gaps worth filling

### 5. View History

**Log** shows a chronological timeline of all ingest events.

## Architecture

```
src/
├── wiki/              # Markdown wiki pages
│   ├── entities/      # Entity pages
│   ├── concepts/      # Concept pages
│   ├── sources/       # Source summary pages
│   ├── summaries/     # High-level synthesis
│   ├── logs/          # Activity log
│   └── index.md       # Auto-generated catalog
├── raw/               # Immutable source documents
├── app/               # Next.js frontend
│   └── (app)/         # Route group
│       ├── AppShell   # Sidebar + header + dark mode
│       └── pages/     # Home, Ingest, Lint, Log, Wiki
├── components/        # Shared components (markdown parser)
└── backend/           # Express API server (port 3001)
```

### Data Flow

```
Source (text/URL)
    → Ingest API → Parse → Classify → Create/Update wiki page
    → Update index.md
    → Append to log.md
    → Frontend reflects via /api/index
```

### Frontend

Next.js 16 App Router, React 19, Tailwind CSS, dark mode, collapsible sidebar, markdown AST rendering (React components, not raw HTML injection).

### Backend

Express server on port 3001. Handles wiki file I/O, LLM-powered query and ingest.

## Development

```bash
# Install
npm install

# Start both frontend + backend
npm run dev

# Frontend: http://localhost:5173
# Backend API: http://localhost:3001

# Start frontend only (Next.js)
npm run dev:frontend

# Start backend only
npm run dev:backend

# Build for production
npm run build
```

## Wiki Page Format

Every page uses YAML frontmatter:

```yaml
---
title: Page Title
category: entity|concept|source|summary
tags: [tag1, tag2]
createdAt: 2026-04-08T00:00:00.000Z
updatedAt: 2026-04-08T00:00:00.000Z
sources: [source-slug-1, source-slug-2]
---

## Summary

One paragraph summary.

## Key Points

- Point 1
- Point 2

## Related

- [[Related Page]] — brief connection
```

## Future Development

### Phase 1 — Core Loop (in progress)
- [x] Frontend with markdown rendering
- [x] Backend API with wiki file I/O
- [x] Ingest workflow
- [x] Cross-reference linking
- [x] Lint health check
- [ ] LLM-powered query page
- [ ] Better URL ingestion (markdown conversion)

### Phase 2 — LLM Integration
- [ ] Claude API integration for ingest — auto-generate page summaries, extract entities, detect contradictions
- [ ] LLM-powered query — synthesize answers from wiki pages with citations
- [ ] Auto-tagging via LLM
- [ ] Page quality scoring

### Phase 3 — Persistence and Scale
- [ ] Replace filesystem I/O with database (SQLite or Postgres)
- [ ] Add full-text search index
- [ ] Multi-user support with authentication
- [ ] Version history for wiki pages
- [ ] Diff view for page changes

### Phase 4 — Intelligence
- [ ] Proactive lint suggestions — LLM identifies gaps based on page structure
- [ ] Auto-merge duplicate pages
- [ ] Temporal awareness — flag outdated claims based on source dates
- [ ] Knowledge graph visualization
- [ ] Export to Obsidian vault format

### Phase 5 — Ecosystem
- [ ] Obsidian plugin for two-way sync
- [ ] Chrome extension for web clipping
- [ ] API for programmatic ingest
- [ ] Embeddable wiki widget
- [ ] Mobile-responsive PWA

## Reference: Karpathy Core Idea

The original concept centers on three insights:

1. **LLMs reason better over compiled knowledge than retrieved snippets.** A wiki page with pre-established context, cross-references, and accumulated understanding is easier for an LLM to reason about than a pile of raw retrieved documents.

2. **Knowledge should persist and compound.** Every ingest event adds to the wiki; future queries benefit from everything previously compiled. Unlike RAG where context is rebuilt from scratch each time.

3. **The LLM is both reader and writer.** It does not just query the knowledge base — it actively maintains it: creating pages, linking concepts, flagging contradictions, updating stale content.

This project implements those three insights as a working wiki system.

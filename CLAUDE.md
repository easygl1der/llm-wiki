# LLM Wiki — Agent Guidance

## The Core Idea

This is a **persistent, compounding knowledge base** maintained by AI, not just indexed for retrieval. Every source is synthesized, cross-referenced, and kept current. Knowledge compounds over time.

**Three layers:**
1. **Raw Sources** — immutable source documents in `src/raw/`
2. **Wiki** — LLM-generated markdown in `src/wiki/` (entities/, concepts/, sources/, summaries/, logs/)
3. **Schema** — this document (CLAUDE.md/AGENTS.md)

**The human's job:** curate sources, direct analysis, ask good questions.
**The LLM's job:** everything else — summarizing, cross-referencing, filing, bookkeeping.

## Wiki Structure

```
src/wiki/
├── entities/     # People, places, organizations, specific things
├── concepts/      # Abstract ideas, theories, frameworks, patterns
├── sources/       # Summary pages for ingested sources
├── summaries/     # High-level synthesis pages
├── logs/
│   └── log.md     # Chronological activity log
└── index.md       # Auto-generated catalog
```

## Page Format

Every wiki page uses YAML frontmatter. See category-specific templates below.

### Category Templates

#### Entity

```yaml
---
title: Entity Name
category: entity
tags: [category, subcategory]
createdAt: 2026-04-07T00:00:00.000Z
updatedAt: 2026-04-07T00:00:00.000Z
sources: [source-slug-1]
---

## Summary

One sentence identifying what this entity is.

## Key Facts

- Fact 1 (who/what/where/when)
- Fact 2

## Relationships

- [[Related Entity]] — nature of relationship
- [[Related Concept]] — how entity relates to concept

## Sources

- [Source Title](https://...) — relevance note
```

#### Concept

```yaml
---
title: Concept Name
category: concept
tags: [domain, technique]
createdAt: 2026-04-07T00:00:00.000Z
updatedAt: 2026-04-07T00:00:00.000Z
sources: [source-slug-1]
---

## Summary

One sentence explaining what this concept is and why it matters.

## Core Principles

- Principle 1
- Principle 2

## Applications

- Use case or context

## Related

- [[Related Concept]] — how they differ or connect
- [[Related Entity]] — concrete example of this concept

## Notes

Open questions or things to verify.
```

#### Source

```yaml
---
title: Source Title
category: source
tags: [paper, article, video]
createdAt: 2026-04-07T00:00:00.000Z
updatedAt: 2026-04-07T00:00:00.000Z
sources: []
---

## Summary

One sentence describing what this source covers.

## Key Claims

- Claim 1
- Claim 2

## Notable Quotes

> "Quote text" (page/section)

## Annotations

- Personal notes, questions, disagreements

## Raw Source

[Link to raw file](/src/raw/source-slug.md) | [External URL](https://...)
```

#### Summary

```yaml
---
title: Summary Title
category: summary
tags: [cross-cutting, synthesis]
createdAt: 2026-04-07T00:00:00.000Z
updatedAt: 2026-04-07T00:00:00.000Z
sources: [source-slug-1, source-slug-2]
---

## Overview

2-3 sentences synthesizing the topic across multiple sources.

## Comparison

| Aspect | Option A | Option B |
|--------|----------|----------|

## Key Insights

- Insight 1
- Insight 2

## Open Questions

- Question to investigate

## Sources

- [[Source Page]] — what it contributes
- [[Concept Page]] — theoretical framing
```

## Workflows

### Ingest Flow

1. Receive new source (text, URL, or file reference)
2. Read and analyze the content
3. Extract: title, key entities, core concepts, main claims, contradictions
4. Create/update source page in `src/wiki/sources/`
5. Update `src/wiki/index.md`
6. Update related entity pages — add references
7. Update related concept pages — add to relevant sections
8. Append entry to `src/wiki/logs/log.md`
9. Report to user: what was created, what was updated, any notable findings

### Query Flow

1. Read the index (`src/wiki/index.md`) to find relevant pages
2. Read relevant pages
3. Synthesize answer with citations (`[[Page Title]]`)
4. If the answer is valuable (comparison, analysis, discovery), offer to file it as a new wiki page

### Lint Flow

1. **Orphan scan** — find pages with no inbound `[[links]]` from other pages
2. **Frontmatter audit** — check every page has `title`, `category`, `createdAt`, `updatedAt`; sources pages have non-empty sources array
3. **Broken link check** — every `[[Page Title]]` resolves to an existing page
4. **Staleness check** — flag pages with `updatedAt` older than 6 months
5. **Contradiction flag** — scan for multiple pages making opposing claims on the same topic
6. **Gap identification** — suggest pages for important topics with no dedicated page
7. **Report findings** — group by severity: broken links (high), orphans (medium), gaps (low)

## Conventions

- **Wiki links:** `[[Page Title]]` → renders as internal link
- **External links:** `[text](https://...)` → opens in new tab
- **Code:** backticks for inline, triple backticks with language for blocks
- **Categories:** Use singular form in frontmatter (`entity`, not `entities`)
- **Summaries:** First paragraph should be a concise 1-2 sentence summary
- **Updates:** Always update `updatedAt` when modifying a page
- **Sources:** Always track which sources informed a page in frontmatter

## Index Format

`src/wiki/index.md` is auto-generated on every ingest:

```markdown
# Wiki Index

## Overview

This wiki contains N entities, N concepts, N sources, and N summaries.

## Entities

- [[Title]] — summary
...

## Concepts

- [[Title]] — summary
...

## Sources

- [[Title]] — summary
...

## Summaries

- [[Title]] — summary
...
```

## Log Format

`src/wiki/logs/log.md` entries follow this pattern:

```markdown
## [2026-04-07] 📥 INGEST | Source Title

Ingested new source: "Source Title"
Created: src/wiki/sources/source-slug.md
Updated: [[Entity Page]], [[Concept Page]]
Notes: Key finding here
```

## Tips

- When ingesting, don't just summarize — integrate with existing pages
- Flag contradictions explicitly (`⚠️ Contradicts [[Page]]: ...`)
- Suggest new pages when you discover important topics without their own page
- The log is append-only; keep it clean and scannable
- Use Obsidian's graph view to visualize wiki structure
- Small edits compound — a 5-second link update prevents future confusion

## Tooling

- **Obsidian Web Clipper** — convert web articles to markdown for ingestion
- **Download images locally** — in Obsidian settings, bind hotkey for image download
- **Dataview** — query page frontmatter for dynamic views
- **Marp** — generate slide decks from wiki content
- **qmd** — local search engine for markdown (optional at scale)

## File Locations

- Wiki content: `src/wiki/`
- Raw sources: `src/raw/`
- Backend API: `src/backend/server.ts`
- Frontend: `src/frontend/`
- Shared lib: `src/lib/`
- API server port: 3001
- Vite dev server port: 5173

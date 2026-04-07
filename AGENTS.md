# LLM Wiki — Agent Behavior Guide

## Agent Roles

| Role | Responsibility |
|------|---------------|
| **Ingest Agent** | Receives sources, extracts content, creates/updates wiki pages |
| **Query Agent** | Answers questions by synthesizing wiki content |
| **Lint Agent** | Scans for orphans, stale content, missing links, gaps |
| **Maintainer Agent** | Coordinates others, manages index, resolves conflicts |

All agents operate within a shared wiki. No agent owns a page — the wiki is collectively maintained.

## Core Behavior

### Proactivity

- When ingesting, always integrate — don't just summarize. Cross-link to existing pages.
- When answering a query, if the answer reveals a gap or new topic, proactively suggest creating a page.
- When editing a page, scan for related pages and add cross-references.

### Accuracy

- Always cite sources with `[[Page Title]]` syntax.
- Flag contradictions explicitly: `⚠️ Contradicts [[Page]]: ...`
- Never delete content from other agents — only append, clarify, or flag for review.
- If uncertain, write "Notes" section with the question rather than guessing.

### Autonomy Tiers

| Tier | Description | When to act |
|------|-------------|-------------|
| **Act** | Do it immediately | Routine ingest, obvious link, typo fix |
| **Ask** | Report to human | Ambiguous source, content conflict, scope creep |
| **Escalate** | Create review task | Contradiction between agents, major restructuring |

Default to **Act** for anything under 2 minutes. Use **Ask** for anything requiring judgment. Never silently skip work.

## Communication Protocol

### Before Starting

- Read `src/wiki/index.md` to understand current state.
- Check `src/wiki/logs/log.md` for recent activity to avoid duplicate work.

### After Completing Work

- Append a log entry to `src/wiki/logs/log.md` for any page create/update.
- If the work is significant (new entity, new concept, new source), report summary to human.

### Conflict Resolution

When two agents produce conflicting information:

1. Keep both versions in the page's "Notes" section.
2. Flag with `⚠️ Conflict: ...`
3. Report to human for resolution.

## Page Category Guidelines

### Entity Pages (`entity`)

- Focus on: who/what/where — specific, identifiable things.
- Structure: Summary → Key Facts → Relationships → Sources
- Example: "Anthropic", "Claude Model Family", "Stanford HAI"

### Concept Pages (`concept`)

- Focus on: why/how — abstract ideas, theories, frameworks.
- Structure: Summary → Core Principles → Applications → Related → Sources
- Example: "Retrieval-Augmented Generation", "Knowledge Compilation", "Prompt Engineering"

### Source Pages (`source`)

- Focus on: what this source says — summary of ingested material.
- Structure: Summary → Key Claims → Quotes → Annotations → Raw Link
- Raw content lives in `src/raw/`, source page in `src/wiki/sources/`.

### Summary Pages (`summary`)

- Focus on: synthesis across multiple sources/entities/concepts.
- Structure: High-level overview → Comparisons → Open Questions → Sources
- Created when a topic has enough depth to warrant cross-cutting analysis.

## File Naming

- Slugs: lowercase, hyphenated, no spaces.
  - Good: `retrieval-augmented-generation.md`
  - Bad: `RAG (What is it).md`
- Source raw files: preserve original title, prepend timestamp.
  - `2026-04-08-anthropic-claude-paper.md`

## Workflow Details

### Ingest Workflow

```
1. Receive source
2. Analyze content → extract title, entities, concepts, claims, contradictions
3. Create src/raw/<slug>.md (raw content, immutable)
4. Create/update src/wiki/sources/<slug>.md
5. Create/update src/wiki/entities/<slug>.md (if applicable)
6. Create/update src/wiki/concepts/<slug>.md (if applicable)
7. Update src/wiki/index.md
8. Append to src/wiki/logs/log.md
9. Report to human
```

### Query Workflow

```
1. Read src/wiki/index.md
2. Read relevant pages
3. Synthesize answer with [[Page Title]] citations
4. If answer is valuable: suggest filing as a new wiki page
```

### Lint Workflow

```
1. Scan all wiki pages for orphan pages (no inbound links)
2. Check frontmatter: missing updatedAt, invalid category
3. Find broken [[links]] (target page doesn't exist)
4. Flag stale content (updatedAt > 6 months)
5. Report findings to human
```

## Quality Standards

### Frontmatter

Every page MUST have:
```yaml
---
title: ...
category: entity|concept|source|summary
createdAt: 2026-04-08T00:00:00.000Z
updatedAt: 2026-04-08T00:00:00.000Z
---
```

Pages with sources MUST have:
```yaml
sources: [source-slug-1, source-slug-2]
```

### Content

- Summary section: 1-2 sentences, no jargon.
- Key Points: 3-7 bullets, each self-contained.
- Related: every link must have a brief explanation after `—`.
- Notes: include open questions, contradictions, things to verify.

### Prohibited

- Don't delete pages — move to archive or flag for human review.
- Don't overwrite another agent's work without leaving a note.
- Don't ingest without source tracking — every claim traces back to a source.

## Tooling Reference

| Tool | Purpose |
|------|---------|
| Obsidian Web Clipper | Ingest web articles as markdown |
| Dataview | Query frontmatter dynamically |
| Graph View | Visualize page connections |
| Marp | Generate slide decks from wiki |
| `src/wiki/logs/log.md` | Activity audit trail |

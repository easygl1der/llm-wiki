---
title: Ingest Workflow
category: concept
tags: [workflow, process, ingestion]
createdAt: 2026-04-08T00:00:00.000Z
updatedAt: 2026-04-08T00:00:00.000Z
sources: []
---

## Summary

The Ingest Workflow is the process by which raw sources — text, URLs, or documents — are transformed into structured, cross-referenced wiki pages. It is the primary mechanism by which the LLM Wiki grows and compounds knowledge over time.

## Process

The ingest flow follows a structured pipeline:

1. **Receive** — A source is submitted via the Ingest page (text paste or URL)
2. **Parse** — Extract title, body text, key entities, and claims
3. **Classify** — Determine category: entity, concept, source, or summary
4. **Create** — Generate a wiki page in the appropriate directory
5. **Link** — Add cross-references to existing related pages
6. **Index** — Update `src/wiki/index.md` with the new entry
7. **Log** — Append an entry to `src/wiki/logs/log.md`
8. **Report** — Present what was created/updated to the user

## Key Principles

- Every ingested source gets its own **source page** documenting what was ingested
- Key entities and concepts extracted from the source get their own pages or are merged into existing pages
- Contradictions with existing content are **flagged explicitly**
- The log is append-only — it serves as an audit trail

## Related

- [[Knowledge Compilation]] — the philosophy behind why we compile vs. retrieve
- [[RAG vs Wiki]] — architectural comparison of this approach vs. RAG

## Notes

- URL ingestion currently fetches raw HTML; markdown conversion quality depends on source structure
- Future: LLM-generated summaries for each page, auto-tagging, deduplication

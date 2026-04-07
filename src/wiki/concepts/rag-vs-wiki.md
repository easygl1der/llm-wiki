---
title: RAG vs Wiki
category: concept
tags: [architecture, comparison, llm]
createdAt: 2026-04-07T00:00:00.000Z
updatedAt: 2026-04-07T00:00:00.000Z
sources: []
---

## Summary

RAG (Retrieval-Augmented Generation) and LLM Wiki represent two fundamentally different approaches to using LLMs with documents.

## Comparison

| Aspect | RAG | LLM Wiki |
|--------|-----|----------|
| **Knowledge state** | Re-derived per query | Compiled and persistent |
| **Cross-references** | Found at query time | Pre-established |
| **Contradictions** | May be missed | Flagged proactively |
| **Scale** | Better at small scale | Better as knowledge grows |
| **Maintenance** | Index once | Continuous updates |
| **Synthesis** | Shallow (per-query) | Deep (accumulated) |

## When to Use Each

- **RAG:** Quick Q&A over a document collection, one-off research
- **LLM Wiki:** Long-term knowledge accumulation, ongoing research, personal knowledge management

## Related

- [[Knowledge Compilation]] — the philosophy behind wiki approach
- [[Ingest Workflow]] — how sources become wiki pages

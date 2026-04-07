---
title: LLM Wiki Overview
category: summary
tags: [meta, system]
createdAt: 2026-04-07T00:00:00.000Z
updatedAt: 2026-04-07T00:00:00.000Z
sources: []
---

## What is LLM Wiki?

LLM Wiki is a pattern for building personal knowledge bases using LLMs. Instead of just retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files.

## The Key Difference

Most people's experience with LLMs and documents looks like RAG: upload files, retrieve chunks at query time, generate answer. This works, but the LLM rediscover knowledge from scratch on every question.

LLM Wiki is different: **the wiki is a persistent, compounding artifact.** Cross-references are already there. Contradictions have been flagged. The synthesis already reflects everything you've read. The wiki keeps getting richer.

## Three Layers

1. **Raw Sources** — immutable source documents
2. **Wiki** — LLM-generated markdown (this layer)
3. **Schema** — CLAUDE.md/AGENTS.md for LLM behavior

## Core Principles

- **Compounding knowledge** — every source adds to existing synthesis
- **LLM-maintained** — the AI does all the bookkeeping
- **Human-directed** — you curate sources and ask questions
- **Interlinked** — connections between ideas are as valuable as ideas themselves

## Related

- [[Knowledge Compilation]] — why this approach builds lasting knowledge
- [[RAG vs Wiki]] — comparison with traditional retrieval approaches

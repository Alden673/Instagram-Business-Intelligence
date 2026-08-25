---
name: Instagram intelligence architecture
description: Durable product and implementation decisions for the Instagram analytics assistant.
---

The first-build MVP keeps analytics local and evidence-based: uploaded account history is the source of truth, while the knowledge folder supplies strategy context. The agent endpoint exposes selected tool names and citations, never private reasoning.

**Why:** The product must be trustworthy for small businesses and remain usable in demo mode without requiring a provider credential.

**How to apply:** Preserve the same separation if adding a hosted Gemini/ADK adapter: provider output may enrich answers, but it must not invent account statistics or bypass the visible tool/activity contract.
# 00 — NEXUS Architecture

## What is NEXUS?

NEXUS is an operational command system built by Moh Khairy.
It connects recruitment, Omega operations, command intelligence, local AI, automation agents, and Supabase data into one controlled intelligence layer.

NEXUS is not a demo.
NEXUS is not a generic SaaS.
NEXUS is a real operational system running live business logic.

## Architecture Layers

### Layer 1: Identity
Who is involved, what roles they hold, what authority they have.
- Moh Khairy = owner, final decision maker
- Hamada = execution engineer
- Antigravity = technical audit environment
- NOVA = intelligence and coordination layer

### Layer 2: Runtime Status
Live monitoring of all local services.
Checked by /api/nova/local-status at each NOVA query.
Services: Command Center, Omega Gateway, Omega Dashboard, Recruitment Hub, Bridge Daemon, Ollama.

### Layer 3: Knowledge Core
Structured markdown documents loaded at server start.
Files in: apps/command-center-ui/runtime/knowledge/
Injected into every NOVA chat as grounding context.
Editable without rebuilding — requires server restart.

### Layer 4: Future Searchable Memory (Phase 4)
Will use nomic-embed-text to embed past conversations, decisions, and session logs.
Will allow NOVA to recall "what did we decide last week" with semantic search.
Not yet active. Infrastructure being prepared.

### Layer 5: Repo Intelligence (Phase 5)
NOVA will be able to reference and reason about GitHub repos in the NEXUS ecosystem.
Initial repo evaluations documented in 04-github-repos-review.md.

### Layer 6: Execution via Hamada / Antigravity
NOVA does not execute commands.
NOVA prepares commands for Hamada.
Hamada executes using Antigravity environment.
Moh approves all changes.

## System Boundaries

- NEXUS Command Center = Omega-system-agnostic operational UI
- Omega Ops Dashboard = Omega-specific operations
- Recruitment Hub = Candidate and hiring system
- NOVA = Intelligence layer only — reads, advises, prepares

## Data Flow

Supabase → Omega Gateway / Recruitment API → NOVA context → Hamada command → Moh approval → Execution

## Key Principles

- Audit before patch
- No commit without Moh approval
- No secrets exposure
- No schema changes without explicit approval
- No fake status — only live data
- No mock data in production

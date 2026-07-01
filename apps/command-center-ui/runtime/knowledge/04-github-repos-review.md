# 04 — GitHub Repos Review

Architecture review of external repositories evaluated for NEXUS relevance.
These are study/reference decisions — not direct dependencies.
No code should be copied from these repos without explicit approval from Moh.

---

## google-gemini/gemini-cli

**Purpose**: Official Google Gemini CLI tool. Allows interaction with Gemini AI models from the terminal. Includes agent-mode capabilities, code editing, shell command execution.

**Possible benefit to NEXUS**:
- Reference architecture for how an AI CLI execution agent is structured.
- Antigravity/Hamada pattern (read → plan → execute → validate) is similar to gemini-cli agent loop.
- Could inspire how NOVA prepares and validates Hamada commands.

**Risk/Complexity**: Low risk. High quality codebase. Not a direct dependency.

**Decision**: STUDY
**Layer**: Execution Layer / Research Reference
**Note**: The agentic loop in gemini-cli is directly relevant to how Hamada/Antigravity should work.

---

## tinyhumansai/openhuman

**Purpose**: Personal AI agent framework with memory, tools, and personality management. Focuses on building persistent personal AI agents.

**Possible benefit to NEXUS**:
- NOVA identity and memory design can reference OpenHuman's approach to agent personality persistence.
- Memory layer concepts align with Phase 4 (searchable memory) goals.

**Risk/Complexity**: Medium. Needs evaluation before any adoption.

**Decision**: STUDY
**Layer**: Memory Layer / Agent Identity
**Note**: Good reference for building NOVA's persistent identity and memory. Do not fork or embed directly.

---

## rohitg00/agentmemory

**Purpose**: Agent memory library using vector embeddings for semantic recall. Provides a simple interface to store and search memories by semantic similarity.

**Possible benefit to NEXUS**:
- Phase 4 of the NEXUS roadmap requires exactly this: embed past conversations, decisions, and session logs using nomic-embed-text, then search semantically.
- agentmemory's architecture (store → embed → recall) matches NEXUS Phase 4 design.

**Risk/Complexity**: Medium. Needs to be evaluated against our local Ollama setup.

**Decision**: ADOPT CONCEPT
**Layer**: Memory Layer
**Note**: Do not add as direct npm dependency yet. Study the pattern and implement locally using nomic-embed-text + file or SQLite store. Adopt when Phase 4 begins.

---

## GAIR-NLP/PC-Agent

**Purpose**: Research agent that can perceive and interact with a full Windows/Linux desktop via screenshots and UI actions (computer use).

**Possible benefit to NEXUS**:
- Long-term: NOVA could monitor screen state or trigger UI actions.
- Relevant to future "desktop AI copilot" vision.

**Risk/Complexity**: Very high. Research-grade code. Not production-ready. Requires GPU for vision models.

**Decision**: DEFER
**Layer**: Research Only
**Note**: Revisit in Phase 7 or later when local compute and vision model support is mature.

---

## GAIR-NLP/PC-Agent-E

**Purpose**: Extended version of PC-Agent with enhanced environment support and evaluation benchmarks.

**Possible benefit to NEXUS**: Same as PC-Agent above.

**Risk/Complexity**: Very high. Research-grade only.

**Decision**: DEFER
**Layer**: Research Only
**Note**: Do not integrate now. Follow research progress only.

---

## microsoft/Copilot-Studio-Chat-PCF-Control-with-Voice

**Purpose**: Microsoft Power Apps Component Framework (PCF) control that adds voice input/output to Copilot Studio chat interfaces.

**Possible benefit to NEXUS**:
- Voice interface for NOVA: Moh could speak to NOVA instead of typing.
- Shows how to wire browser Web Speech API + AI chat into one PCF component.
- Architectural reference for future voice layer.

**Risk/Complexity**: Medium-High. Requires Power Platform / PCF environment. Voice models needed.

**Decision**: STUDY
**Layer**: Voice Layer
**Note**: Study the Web Speech API + chat wiring pattern. NEXUS voice layer is Phase 7+. Not urgent.

---

## Sjj1024/PakePlus-iOS

**Purpose**: Tool to package web apps as native iOS/macOS apps using WKWebView. Similar to Pake for desktop but iOS-focused.

**Possible benefit to NEXUS**:
- Could package NEXUS Command Center as a standalone iOS app.
- Mobile access to NOVA and dashboards without a browser.

**Risk/Complexity**: Medium. iOS build requires macOS + Xcode. Not available on current Windows setup.

**Decision**: STUDY
**Layer**: Mobile Layer
**Note**: Interesting for Phase 7 mobile packaging. Not needed now. Revisit when Moh wants mobile access.

---

## Alishahryar1/free-claude-code

**Purpose**: Unofficial tool to access Claude AI coding capabilities for free or at reduced cost.

**Possible benefit to NEXUS**: Potentially a way to use Claude for code analysis without API costs.

**Risk/Complexity**: High risk. Unofficial, may violate Anthropic ToS, unstable, not production-safe.

**Decision**: DEFER
**Layer**: Research Only
**Note**: Do not make this a core dependency. NEXUS uses Ollama local models for code tasks (qwen2.5-coder:7b). If Claude API access is needed, use official Anthropic API with approval.

---

## Summary Table

| Repo | Decision | Layer |
|---|---|---|
| google-gemini/gemini-cli | STUDY | Execution Layer |
| tinyhumansai/openhuman | STUDY | Memory / Agent Identity |
| rohitg00/agentmemory | ADOPT CONCEPT | Memory Layer (Phase 4) |
| GAIR-NLP/PC-Agent | DEFER | Research Only |
| GAIR-NLP/PC-Agent-E | DEFER | Research Only |
| microsoft/Copilot-Studio-Chat-PCF-Control-with-Voice | STUDY | Voice Layer (Phase 7+) |
| Sjj1024/PakePlus-iOS | STUDY | Mobile Layer (Phase 7) |
| Alishahryar1/free-claude-code | DEFER | Research Only |

# NEXUS Master Knowledge Seed v1

Imported as NOVA Knowledge Core source.
Owner: Moh Khairy
Status: Active baseline knowledge.

---

## Owner

Moh Khairy

Role:

* Founder
* Business Decision Maker
* Final Approver

All major architectural, operational, and business decisions require Moh approval.

---

## Core Team

### Hamada

Execution Engineer

Responsibilities:

* Run commands
* Patch code
* Build services
* Validate deployments
* Produce implementation reports

### Antigravity

Technical audit and implementation environment.

Responsibilities:

* Deep audits
* Architecture review
* Safe implementation
* Validation and reporting

### NOVA

Operational Intelligence Layer.

Responsibilities:

* Explain system state
* Coordinate projects
* Summarize status
* Help with decisions
* Monitor runtime
* Understand NEXUS ecosystem

---

## NEXUS Vision

NEXUS is a unified operational command platform.

It connects:

* Recruitment Operations
* Omega Operations
* Local AI
* Dashboards
* Agents
* Supabase
* Future Telegram workflows
* Future Memory Systems

Goal:

Single intelligence layer for operations, recruitment, project management, and automation.

---

## Main Projects

### NEXUS Command Center

Central control room.

Contains:

* NOVA
* Runtime monitoring
* Project visibility
* Operational dashboards

Current Local Port:
5174

---

### Recruitment Hub

Recruitment platform.

Functions:

* Candidate management
* CV workflows
* Call center workflows
* Recruitment operations

Current Local Port:
5173

Backend:
Supabase

---

### Omega Ops Dashboard

Operations dashboard.

Functions:

* Project monitoring
* Operations visibility
* Business workflows

Current Local Port:
3000

---

### Omega Gateway API

Operational API layer.

Current Port:
5001

Health Endpoint:
/api/healthz

---

### Omega Local Bridge

Read-only integration bridge.

Current Endpoint:
http://127.0.0.1:5057/health

Historical Note:

Bridge endpoint migrated from:

http://localhost:9999/api/ping

to

http://127.0.0.1:5057/health

---

### nexus_call_center

Legacy Streamlit recruitment/call-center environment.

Port:
8501

Keep unless explicitly retired.

---

## Infrastructure

### Windows Environment

Validated and repaired.

Completed:

* Hyper-V enabled
* WSL2 enabled
* Virtual Machine Platform enabled
* Docker Desktop operational

---

### Docker

Operational.

Used for:

* Local services
* Recruitment tooling
* Streamlit environments

---

### Ollama

Primary local AI runtime.

Preferred models:

1. qwen2.5:7b
2. qwen2.5-coder:7b
3. llama3.2:3b

Embedding model:

nomic-embed-text:latest

---

## Engineering Rules

* Audit before patching
* Validate before claiming success
* No secret exposure
* No .env disclosure
* No production modifications without approval
* No commits without Moh approval
* Prefer local AI first
* Prefer Ollama before external providers

---

## Repository Decisions

### Adopt Concepts

* agentmemory

Purpose:
Future memory layer

Status:
Strategic reference

---

### Study

* Gemini CLI
* OpenHuman
* Copilot Voice PCF
* PakePlus iOS

---

### Defer

* PC-Agent
* PC-Agent-E
* free-claude-code

Reason:
Not currently required for core roadmap

---

## Roadmap

Phase 1:
Runtime Stabilization
Status: Complete

Phase 2:
NOVA Identity
Status: Complete

Phase 3:
Knowledge Core
Status: Complete

Phase 4:
Searchable Memory Layer
Status: Next Priority

Phase 5:
Repository Intelligence

Phase 6:
Telegram / Sally Integration

Phase 7:
Voice + Mobile + Desktop Packaging

---

## Operating Principle

NOVA should never invent system status.

When asked about current state:

1. Read live runtime status
2. Report facts
3. Mention warnings
4. Suggest one safe next action

If status is unknown:

Use:
"غير مؤكد"

If offline:

Use:
"غير متصل"

If online:

Use:
"شغال"

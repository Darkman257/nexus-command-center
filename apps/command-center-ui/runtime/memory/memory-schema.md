# NEXUS Memory Core Schema v1

This document defines the schema of the local-first searchable memory layer (`nexus-memory.jsonl`) for NOVA inside the NEXUS Command Center.

## Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (e.g. `mem_001`, `rec_001`). |
| `category` | `string` | Classification category (see Categories below). |
| `type` | `string` | Entry type (e.g. `event`, `fact`, `rule`, `decision`, `config`). |
| `title` | `string` | Title of the memory record. |
| `content` | `string` | Text content of the memory record. |
| `tags` | `array of strings` | Keyword tags for retrieval matching (both English & Arabic). |
| `source` | `string` | The source of the memory (e.g. `system-audit`, `governance`). |
| `confidence` | `number` | Confidence score between `0.0` and `1.0`. |
| `importance` | `number` | Rating from `1` (low) to `5` (critical) for ranking. |
| `created_at` | `string` | ISO 8601 UTC timestamp. |

## Categories

- `runtime` - Live microservices, host configuration, local runtime ports.
- `project` - Active sub-projects, modules, workspace environments.
- `decision` - Historical structural choices, model preferences, migration choices.
- `people` - Profiles, roles, decision paths, human interactions.
- `repo` - GitHub analysis, directories, build systems.
- `roadmap` - Plans, future enhancements, memory and intelligence architecture.

## Sample Record

```json
{
  "id": "mem_001",
  "category": "runtime",
  "type": "config",
  "title": "Omega Dashboard Port Assignment",
  "content": "Omega Dashboard runs locally on port 3000 under Vite.",
  "tags": ["omega", "dashboard", "port", "3000", "بورت", "أوميجا"],
  "source": "system-audit",
  "confidence": 1.0,
  "importance": 4,
  "created_at": "2026-05-29T12:00:00Z"
}
```

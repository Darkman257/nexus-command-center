# NEXUS Memory Kernel

## Overview
The Memory Kernel provides NOVA with deep business context, shifting its capability from pure system-level awareness to domain-level understanding.

## Structure
The kernel is composed of three primary JSON files:

### 1. `entities.json`
Stores core domain objects.
- `id`: Unique identifier (e.g., `p_nova`, `sys_omega`).
- `type`: Category of the entity (`person`, `project`, `company`, `system`, `vehicle`, `asset`, `document`, `task`, `decision`, `event`).
- `name` / `title`: The display name or title.
- `role` / `description`: Explains what the entity is or does.

### 2. `relationships.json`
Maps how entities connect to each other.
- `from`: Source entity ID.
- `to`: Target entity ID.
- `relation`: A descriptive string of how they relate (e.g., "launches and monitors").
- `confidence`: Certainty score (1.0 = absolute truth).
- `source`: Where this relationship was derived from.
- `createdAt`: Timestamp.

### 3. `timeline.json`
Tracks major events, milestones, and historical context.
- `id`: Unique event ID.
- `date`: Approximate or exact date.
- `title`: Short title of the event.
- `type`: Type of event (e.g., `milestone`, `incident`).
- `summary`: Detailed description.
- `relatedEntities`: Array of entity IDs involved.
- `importance`: Level of significance (e.g., `low`, `medium`, `high`, `critical`).

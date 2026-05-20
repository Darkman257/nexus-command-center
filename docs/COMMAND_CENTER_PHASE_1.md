# NEXUS Command Center — Phase 1 Design

## Overview
Phase 1 implements a standalone, read-only operational dashboard designed with the premium Dark NEXUS UI aesthetic. It is completely isolated from production systems to enforce strict domain boundaries.

## Architecture
- **Front-end**: React 19 + TypeScript + Vite.
- **Styling**: Vanilla CSS (CSS variables, flexbox/grid layout, glassmorphism, glowing micro-animations).
- **Subsystem Telemetry (Mocked)**:
  1. **Omega Ops**: Online (142 Staff, 4 Projects)
  2. **Recruitment Hub**: Audit Required (18 Applicants, 52 CVs Ingested)
  3. **Asset Hub**: Simulating (24 Assets, 8 Vehicles Active)

## Execution Logs
The events display simulates real-time activity and git operations carried out during the current maintenance window.

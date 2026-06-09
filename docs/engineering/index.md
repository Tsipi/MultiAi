# Engineering Documentation

This folder contains internal engineering and implementation documentation for MultiAI.

## Documents

| File | Purpose |
|---|---|
| architecture.md | High-Level Architecture and system flow |
| project-structure.md | High-level folders and component structure |
| dev-setup.md | Local development setup instructions |
| deployment.md | Deployment overview and infrastructure direction |
| railway-deployment.md | Step-by-step guide to deploying on Railway with PostgreSQL |
| backend-stack.md | What SQLAlchemy, Alembic, FastAPI-Users, and bcrypt are and why they're used |
| conventions.md | Coding and project conventions |
| intent-assessment.md | Intent clarification and ambiguity handling |
| ux-notes.md | UX and interface implementation notes |
| legacy-phase-1-consensus-rules.md | Historical notes for the original fixed Writer/Critic architecture |

## Current Product Direction

MultiAI is evolving toward an "Agents Studio" platform where users configure AI teams composed of Writer and Critic agents using different models, prompts, and workflows.

The current implementation supports configurable Writer and Critic agents, iterative debate/refinement loops, consensus scoring, and session persistence.
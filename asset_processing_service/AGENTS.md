```markdown
# AGENTS Guidelines for This Repository

Codex and other coding agents should read this file before making changes. Codex supports project-specific instructions via `AGENTS.md`. :contentReference[oaicite:0]{index=0}

---

## About the Project

This repository contains an **Asset Processing Service** written in **Python** (managed with **Poetry**) that uses **LangChain** and **LangGraph** for AI capabilities. It processes assets (text/audio/video) and produces extracted content for downstream knowledge workflows.

At a high level, this repo is a **job-driven ToDo/memory agent** implemented as a **background worker service** (not a user-facing app).

### Runtime Model (Worker Service)

- The active runtime is `src/asset_processing_service/main.py`.
- It **polls Postgres** for eligible rows in `asset_processing_jobs`.
- It pushes jobs onto an **asyncio queue**, runs **worker tasks**, updates **heartbeats**, and handles:
  - stuck jobs (heartbeat too old)
  - retry limits / max attempts

### Job Payload Shape

- A job is effectively a “chat request” persisted in Postgres.
- Each job includes:
  - `thread_id`, `user_id`, `todo_kind`, `message`, `status`
  - plus fields for storing the assistant’s last reply (`last_msg_type`, `last_msg_content`)
- The job schema + DB helpers live in:
  - `src/asset_processing_service/api_client.py`
  - `src/asset_processing_service/models.py`

### What Workers Do

- Worker behavior is implemented in `src/asset_processing_service/job_processor.py`:
  - Invokes a **LangGraph-based assistant** using the job’s `message`
  - Passes `thread_id`, `user_id`, and `todo_kind` via graph `config`
  - Writes the final assistant response back onto the same job row
- The graph definition is in `src/asset_processing_service/life_goals_agent.py`.
  - The assistant is a memory-backed ToDo system that maintains:
    - a **user profile**
    - a **ToDo collection**
    - **user instructions/preferences** for how ToDos should be managed

### Storage & Memory

- **Short-term graph checkpointing**: Redis via `RedisSaver`
- **Long-term memory**: Postgres via `PostgresStore`
- **LLM backend**: OpenAI (initialized via `setup_config.py` and utilities under `src/asset_processing_service/my_utils/`)

---

## Where to Look First (Quick File Map)

If you’re new to the repo, start here (in this order):

1. `src/asset_processing_service/main.py`  
   Main runtime loop: polls Postgres, queues jobs, runs workers, handles stuck jobs/retries, shutdown logic.

2. `src/asset_processing_service/api_client.py` + `src/asset_processing_service/models.py`  
   Job schema + DB helpers for `asset_processing_jobs` (create/fetch/update/heartbeat).

3. `src/asset_processing_service/job_processor.py`  
   What a worker actually does per job (invokes graph, writes assistant reply back to the job row).

4. `src/asset_processing_service/life_goals_agent.py`  
   The LangGraph ToDo/memory assistant graph definition and memory update flow.

5. `src/asset_processing_service/setup_config.py` + `src/asset_processing_service/my_utils/`  
   Environment loading, logger setup, LLM initialization, Redis/Postgres helpers, token tracking.

---

## 0. Documentation First for External Libraries

When implementing or changing behavior involving **external** libraries/services (not internal repo code), consult current official docs first (examples):

- Poetry / dependency management
- LangGraph / LangChain APIs
- asyncpg / aiohttp
- RedisSaver / PostgresStore behavior

Poetry docs: :contentReference[oaicite:1]{index=1}  
LangGraph local server / CLI docs: :contentReference[oaicite:2]{index=2}

---

## 1. Setup & Run Commands (Windows 11 + PowerShell)

Prefer running everything through Poetry. (Poetry is the source of truth for the env + deps.) :contentReference[oaicite:3]{index=3}

### Install dependencies

- `poetry install`

### Run the worker service

- `poetry run python -m asset_processing_service.main`

### Run in “testing mode” (creates selected test jobs)

- `poetry run python -m asset_processing_service.main --tests 1,5`

### Useful Poetry helpers

- `poetry env info`
- `poetry run <cmd>`

---

## 2. Environment Variables (.env)

This repo loads env vars from `.env` (see `src/asset_processing_service/my_utils/env_loader.py`).

Common required keys (verify in `src/asset_processing_service/setup_config.py` + runtime init):

- `OPENAI_API_KEY`
- `SERVER_API_KEY`
- `DB_URL` (optional `DB_URL_FALLBACK`)
- `REDIS_URL`
- `TAVILY_API_KEY` (if enabled)

Guidelines:

- Never commit secrets.
- If init fails, verify env vars and connectivity to Postgres/Redis first.

---

## 3. LangGraph Local Dev Notes (Optional)

If you use LangGraph’s local server tooling:

- `langgraph dev`

This is intended for local development/testing workflows. :contentReference[oaicite:4]{index=4}

---

## 4. Coding Conventions (Repo Rules)

### 4.1 Keep changes reviewable

- Prefer small, focused edits.
- When changing runtime behavior, update any relevant comments/docs.

### 4.2 Line-ending change markers

This repo uses explicit line-ending markers for code edits:

- New lines: append `#  Added Code`
- Modified existing lines: append `#  Changed Code`
- If a line is both “added+modified”, use only `#  Changed Code`
- Do **not** add markers to lines that did not change.

### 4.3 Avoid import-time side effects

Prefer runtime initialization patterns (this repo already avoids heavy work at import time in places).
Do not introduce new “do work on import” behavior unless necessary.

---

## 5. Database Safety Rules (Postgres Jobs Table)

Primary table: `asset_processing_jobs`

Rules:

- Avoid destructive operations (drop/truncate/delete) unless you are explicitly in a test-only workflow.
- Use safe patterns: `CREATE TABLE IF NOT EXISTS`, careful indexing, and additive schema changes.

---

## 6. Operational Guardrails (Async / Threads / Shutdown)

This service uses:

- asyncio queues + worker tasks
- background heartbeat updates
- Redis/Postgres connections

When modifying:

- worker loops
- cancellation/shutdown logic
- background tasks / threads

You must ensure:

- tasks are cancelled and awaited cleanly
- no non-daemon threads keep the process alive
- shutdown stays deterministic and doesn’t leak resources

If you add new background tasks, also add cancellation/shutdown handling.

---

## 7. Useful Commands Recap

| Command                                                          | Purpose                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `poetry install`                                                 | Install dependencies                                                    |
| `poetry run python -m asset_processing_service.main`             | Run the worker service                                                  |
| `poetry run python -m asset_processing_service.main --tests 1,5` | Run in testing mode with selected jobs                                  |
| `poetry env info`                                                | Show active Poetry env info                                             |
| `langgraph dev`                                                  | Optional local dev server tooling :contentReference[oaicite:5]{index=5} |

---

## 8. Agent Mindset (Quality Bar)

- Finish tasks completely as requested.
- Keep the repo runnable after changes.
- Prefer clear, maintainable Python with good naming.
- When uncertain, add a short comment explaining the safety/intent.

---

## 9. ExecPlans (Bigger Changes)

For complex features or significant refactors, create a short “ExecPlan” first.

**ExecPlan rules for this repo live in:** `.agent/PLANS.md`

Agents must:

- Read `.agent/PLANS.md` before writing an ExecPlan.
- Follow `.agent/PLANS.md` **to the letter** when authoring or executing an ExecPlan.
- Keep ExecPlans as living documents (update Progress / Surprises & Discoveries / Decision Log / Outcomes & Retrospective as work proceeds).
```

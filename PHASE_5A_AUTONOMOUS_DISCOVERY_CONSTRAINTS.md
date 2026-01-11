# Phase 5A: Autonomous Discovery Runner - Constraints

> **Status:** Active  
> **Created:** January 11, 2026  
> **Last Updated:** January 11, 2026  
> **Purpose:** Define non-negotiable constraints for Phase 5A implementation

---

## Overview

This document defines the **hard constraints** that MUST be respected during Phase 5A implementation. These constraints ensure safety, idempotency, and non-destructive operation of the autonomous discovery runner.

---

## 1. Hard Constraints (Non-Negotiable)

### 1.1 No Outreach

| Constraint | Description |
|------------|-------------|
| **NO EMAILS** | Phase 5A MUST NOT send any emails |
| **NO WHATSAPP** | Phase 5A MUST NOT send any WhatsApp messages |
| **NO DMS** | Phase 5A MUST NOT send any direct messages |
| **NO MESSAGING** | Phase 5A MUST NOT trigger any outreach mechanism |

**Rationale:** Phase 5A is purely about discovery (finding leads). All outreach is deferred to Phase 6.

### 1.2 No LLM Brain

| Constraint | Description |
|------------|-------------|
| **NO LLM DECISIONS** | Phase 5A MUST NOT use LLMs for decision-making |
| **NO AI FILTERING** | Phase 5A MUST NOT use AI to filter/qualify discovered leads |
| **NO AI PRIORITIZATION** | Phase 5A MUST NOT use AI to prioritize which leads to persist |

**Rationale:** The Brain/Policy layer is Phase 5B scope. Phase 5A uses existing deterministic discovery channels only.

### 1.3 No Destructive Operations

| Constraint | Description |
|------------|-------------|
| **NO DATABASE RESETS** | Phase 5A MUST NOT reset or truncate tables |
| **NO DATA WIPING** | Phase 5A MUST NOT delete existing leads/companies/contacts |
| **NO SCHEMA DESTRUCTION** | Phase 5A MUST NOT drop or recreate tables |
| **APPEND-ONLY** | Discovery runs create/skip records, NEVER delete |

**Rationale:** Data integrity is paramount. Discovery should only add value, never destroy existing data.

### 1.4 No Breaking Changes to Phases 1-4

| Constraint | Description |
|------------|-------------|
| **NO ROUTE CHANGES** | Phase 2-4 API routes MUST NOT be modified |
| **NO MODEL CHANGES** | Existing Lead/Company/Contact models MUST NOT change schema |
| **NO UI BREAKING** | Existing dashboard/CRM pages MUST remain functional |
| **NO AUTH CHANGES** | Authentication system MUST NOT be modified |

**Rationale:** Phase 5A is additive. Existing functionality must remain stable.

---

## 2. Safety Constraints

### 2.1 Bounded Execution

| Constraint | Default | Description |
|------------|---------|-------------|
| **MAX_COMPANIES_PER_RUN** | 50 | Maximum companies to create per run |
| **MAX_RUNTIME_SECONDS** | 300 | Maximum wall-clock time per run (5 minutes) |
| **MAX_QUERIES_PER_RUN** | 10 | Maximum discovery queries per run |
| **MAX_CONCURRENT_CHANNELS** | 1 | Channels run sequentially (no parallel) |

**Rationale:** Prevents runaway processes, API quota exhaustion, and Vercel timeout issues.

### 2.2 Rate Limiting

| Constraint | Description |
|------------|-------------|
| **ONE RUN AT A TIME** | No concurrent discovery runs allowed |
| **MINIMUM INTERVAL** | At least 1 hour between runs (enforced via run tracking) |
| **API BACKOFF** | External API calls must respect rate limits |

**Rationale:** Prevents API abuse and ensures predictable system behavior.

### 2.3 Idempotency

| Constraint | Description |
|------------|-------------|
| **NO DUPLICATE COMPANIES** | Companies are deduplicated by website or name |
| **NO DUPLICATE CONTACTS** | Contacts are deduplicated by email, LinkedIn URL, or (name + company) |
| **NO DUPLICATE LEADS** | Leads are deduplicated by email |
| **RE-RUNNABLE** | Running discovery twice with same queries produces same final state |

**Rationale:** Ensures data quality and prevents database bloat.

### 2.4 Observability

| Constraint | Description |
|------------|-------------|
| **RUN TRACKING** | Every discovery run MUST be recorded with start/end timestamps |
| **STATS RECORDING** | Every run MUST record counts (created, skipped, errors) |
| **ERROR CAPTURE** | Failures MUST be captured and stored in run record |
| **STATUS TRACKING** | Run status MUST be tracked (pending, running, completed, failed) |

**Rationale:** Enables debugging, monitoring, and alerting.

---

## 3. Infrastructure Constraints

### 3.1 Vercel Compatibility

| Constraint | Description |
|------------|-------------|
| **SERVERLESS** | Runner MUST work within Vercel serverless function limits |
| **COLD START** | Must handle cold starts gracefully |
| **MAX DURATION** | Must complete within Vercel Pro function timeout (300s) |
| **CRON FORMAT** | Must use Vercel cron syntax in vercel.json |

### 3.2 Environment Variables

| Constraint | Description |
|------------|-------------|
| **ENABLE SWITCH** | `DISCOVERY_RUNNER_ENABLED` env var MUST gate all execution |
| **SECRET HEADER** | Cron endpoint MUST require `CRON_JOB_SECRET` header |
| **CONFIG VIA ENV** | All limits/budgets MUST be configurable via env vars |

### 3.3 Database

| Constraint | Description |
|------------|-------------|
| **PRISMA ONLY** | All DB operations via Prisma client |
| **NO RAW SQL** | No raw SQL queries (for safety and type safety) |
| **TRANSACTION SAFETY** | Critical operations should use transactions where appropriate |

---

## 4. Implementation Constraints

### 4.1 Code Organization

| Constraint | Description |
|------------|-------------|
| **LOCATION** | Runner code in `lib/discovery/runner/` |
| **ROUTE LOCATION** | Job API in `app/api/jobs/discovery/run/route.ts` |
| **SEPARATION** | Runner logic separate from API handler |

### 4.2 Dependencies

| Constraint | Description |
|------------|-------------|
| **USE EXISTING** | MUST use existing `DiscoveryAggregator` |
| **USE EXISTING** | MUST use existing `persistDiscoveryResults` |
| **NO NEW DEPS** | No new npm packages for core runner logic |

### 4.3 Testing

| Constraint | Description |
|------------|-------------|
| **DRY RUN MODE** | MUST support dry-run mode (no DB writes) |
| **LOCAL RUNNABLE** | MUST be runnable locally via script |
| **LINT PASS** | MUST pass `npm run lint` |
| **TYPE CHECK** | MUST pass `npx tsc --noEmit` |

---

## 5. Security Constraints

### 5.1 API Security

| Constraint | Description |
|------------|-------------|
| **POST ONLY** | Job endpoint MUST be POST method only |
| **SECRET REQUIRED** | MUST verify `x-job-secret` header |
| **NO PUBLIC ACCESS** | Endpoint MUST NOT be callable without secret |
| **RATE LIMITED** | Internal rate limiting to prevent abuse |

### 5.2 Data Security

| Constraint | Description |
|------------|-------------|
| **NO SENSITIVE LOGS** | MUST NOT log API keys or secrets |
| **NO PII IN ERRORS** | Error messages MUST NOT contain PII |
| **AUDIT TRAIL** | All runs tracked with triggeredBy field |

---

## 6. Forbidden Actions

The following actions are **EXPLICITLY FORBIDDEN** in Phase 5A:

1. ❌ Deleting or updating existing lead/company/contact records (only create/skip)
2. ❌ Modifying the `source` or `businessSource` of existing leads
3. ❌ Triggering any webhook or external notification to end users
4. ❌ Sending any form of communication to discovered contacts
5. ❌ Calling any LLM or AI service
6. ❌ Modifying authentication or authorization logic
7. ❌ Running discovery without proper enable flag check
8. ❌ Running discovery without run tracking
9. ❌ Exposing the job endpoint without secret verification
10. ❌ Using destructive database operations (DELETE, TRUNCATE, DROP)

---

## 7. Constraint Verification Checklist

Before completing Phase 5A, verify:

- [ ] `DISCOVERY_RUNNER_ENABLED=false` prevents all execution
- [ ] `x-job-secret` header is required and validated
- [ ] Discovery respects MAX_COMPANIES_PER_RUN limit
- [ ] Discovery respects MAX_RUNTIME_SECONDS limit
- [ ] No duplicate leads created when running twice
- [ ] No existing records modified
- [ ] Run history is persisted with accurate stats
- [ ] Dry-run mode produces no database writes
- [ ] All tests pass
- [ ] Lint and type check pass
- [ ] Phase 2-4 routes still work correctly

---

## Related Documents

- [PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md) - Technical design
- [PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md) - MVP definition
- [PHASE_1_Discovery_Design_Locked.md](./PHASE_1_Discovery_Design_Locked.md) - Discovery architecture

---

**Document Owner:** Engineering  
**Review Frequency:** Before implementation starts  
**Last Review:** January 11, 2026

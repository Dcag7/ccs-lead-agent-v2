# Core Lead Agent Definition

> **Status:** Living Document - Source of Truth  
> **Created:** January 11, 2026  
> **Last Updated:** January 11, 2026 (v1.2)  
> **Ownership:** This document MUST be updated whenever new phase features are added

---

## Document Purpose

This document serves as the **living source of truth** for what the CCS Lead Agent system is, what it does, and what it doesn't do. It must be kept current as the system evolves.

### What Is the Lead Agent?

The CCS Lead Agent is a **purpose-built digital employee** for CCS Apparel's business development team. It is:

- **An agent, not just a platform** — Designed to act autonomously within defined boundaries
- **A system that evolves** — Progressing from manual to assisted to autonomous operation
- **A human-supervised tool** — Always with guardrails, never fully autonomous without approval

### Agent Identity Principles

| Principle | What It Means |
|-----------|---------------|
| **Proactive** | The agent finds and qualifies leads; it doesn't wait passively |
| **Bounded autonomy** | Operates within rules, budgets, and human-defined policies |
| **Human-in-the-loop** | Critical decisions (especially messaging) require human approval |
| **Transparent** | Actions are logged, explainable, and auditable |
| **Incremental trust** | Autonomy is earned through proven reliability, phase by phase |

### Update Requirements

**This document MUST be updated when:**
- A new phase feature is implemented
- A capability is added or removed
- The operating loop changes
- Guardrails are added or modified
- Failure modes are discovered

**Who updates:** The developer implementing the feature, reviewed by project owner.

---

## 1. What the Lead Agent Does Today

**Current Capabilities (as of January 11, 2026):**

### 1.1 Lead Management (CRM)
- ✅ Store and manage Leads, Contacts, and Companies
- ✅ Track lead status through lifecycle (new → contacted → qualified → archived)
- ✅ Assign leads to team members (ownership)
- ✅ Add internal notes to leads
- ✅ Bulk operations (change status, assign owner for multiple leads)
- ✅ Filter and search leads by multiple criteria

### 1.2 Company Enrichment
- ✅ Enrich companies using Google Custom Search
- ✅ Extract website metadata (title, description)
- ✅ Infer industry from search results
- ✅ Track enrichment status and history

### 1.3 Lead Scoring
- ✅ Calculate lead scores (0-100) based on rules
- ✅ Calculate company scores (0-100) based on rules
- ✅ Classify leads as hot/warm/cold
- ✅ Explain scoring factors
- ✅ Recalculate scores on demand

### 1.4 Data Import
- ✅ Import companies from CSV
- ✅ Import contacts from CSV
- ✅ Import leads from CSV
- ✅ Deduplicate and link records during import

### 1.5 Discovery Architecture (Ready, Execution In Progress)
- ✅ Google search discovery channel (implemented)
- ✅ Website signal extraction (implemented)
- ✅ Keyword discovery channel (implemented)
- ✅ Discovery metadata storage (implemented)
- 🔄 **Phase 5A:** Autonomous daily discovery runner in progress
  - Daily scheduling via Vercel Cron
  - DiscoveryRun tracking model
  - Secured job endpoint with dry-run support
  - **No outreach** - discovery only

---

## 2. What the Lead Agent Does NOT Do Yet

**Explicitly NOT Implemented (as of January 11, 2026):**

### 2.1 Discovery Execution
- 🔄 Scheduled/daily discovery runs (Phase 5A in progress)
- 🔄 Manual discovery trigger via secured API (Phase 5A in progress)
- 🔄 Run tracking and history (Phase 5A in progress)
- 🔄 Discovery budgets/quotas via env vars (Phase 5A in progress)

### 2.2 Policy/Brain Layer
- ❌ No ICP (Ideal Customer Profile) rules
- ❌ No allow/block lists
- ❌ No action recommendations
- ❌ No deterministic rules engine

### 2.3 Messaging / Conversations
- ❌ No conversation storage
- ❌ No message ingestion
- ❌ No unified inbox
- ❌ No reply capability
- ❌ No channel integrations (Respond.io, email, WhatsApp)
- ❌ No identity resolution for message senders
- ❌ No autopilot / automated replies

### 2.4 Orders and Revenue
- ❌ No orders tracking
- ❌ No revenue attribution
- ❌ No client profile matching

### 2.5 Learning and Optimization
- ❌ No outcome tracking
- ❌ No conversion analysis
- ❌ No self-improving algorithms
- ❌ No forecasting

### 2.6 Activity Logging
- ❌ No comprehensive activity logs
- ❌ No audit trail for all actions
- ❌ No sync history

---

## 3. The Agent's Operating Loop

**Target Operating Loop (Future State):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAD AGENT OPERATING LOOP                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐  │
│  │ DISCOVER │ →  │ ENRICH   │ →  │ SCORE   │ →  │ MANAGE   │  │
│  │          │    │          │    │         │    │          │  │
│  │ Find new │    │ Add data │    │ Rate &  │    │ Assign,  │  │
│  │ prospects│    │ from web │    │ classify│    │ status,  │  │
│  │          │    │          │    │         │    │ notes    │  │
│  └──────────┘    └──────────┘    └─────────┘    └──────────┘  │
│       │                                              │         │
│       │                                              ▼         │
│       │         ┌──────────┐    ┌─────────┐    ┌──────────┐  │
│       │         │ LEARN    │ ←  │ HANDOFF │ ←  │ MESSAGE  │  │
│       │         │          │    │         │    │          │  │
│       │         │ Track    │    │ Convert │    │ Reply,   │  │
│       └─────────│ outcomes │    │ to      │    │ nurture  │  │
│                 │          │    │ customer│    │          │  │
│                 └──────────┘    └─────────┘    └──────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Current State Implementation:**

| Stage | Status | Notes |
|-------|--------|-------|
| **DISCOVER** | 🔄 In Progress | Phase 5A: Daily runner being implemented |
| **ENRICH** | ✅ Implemented | Google CSE, website metadata |
| **SCORE** | ✅ Implemented | Rule-based 0-100 scoring |
| **MANAGE** | ✅ Implemented | Full CRM capabilities |
| **MESSAGE** | ❌ Not Started | Phase 6 |
| **HANDOFF** | ❌ Not Started | Manual process today |
| **LEARN** | ❌ Not Started | Phase 8 |

---

## 4. Guardrails and Safety

### 4.1 Current Guardrails

| Guardrail | Status | Description |
|-----------|--------|-------------|
| Authentication Required | ✅ Active | All CRM actions require login |
| Domain Restriction | ✅ Active | Only @ccsapparel.africa/co.za can login |
| Role-Based Access | ⚠️ Basic | Admin vs User roles exist |
| Data Validation | ✅ Active | Input validation on all forms |

### 4.2 Planned Guardrails (Phase 6+)

| Guardrail | Phase | Description |
|-----------|-------|-------------|
| Read-Only Mode | 6A | No sending capability initially |
| Human Approval | 6B | All sends require user click |
| Rate Limiting | 6C | Max messages per hour/day |
| Quiet Hours | 6C | No sends during specified times |
| Kill Switch | 6C | Instant disable all autopilot |
| Audit Logging | 6C | Full trail of automated actions |
| Escalation Rules | 6C | Auto-escalate on triggers |

### 4.3 Discovery Guardrails (Phase 5A - In Progress)

| Guardrail | Description | Status |
|-----------|-------------|--------|
| Daily Budget | Max companies/queries per run via env vars | 🔄 Implementing |
| Enable Switch | `DISCOVERY_RUNNER_ENABLED` env var | 🔄 Implementing |
| Dry Run Mode | Test without DB writes | 🔄 Implementing |
| Idempotency | No duplicate prospects via existing dedup | ✅ Uses Phase 1 |
| Run Tracking | All runs logged with stats | 🔄 Implementing |
| Failure Alerts | Notify on repeated failures | ❌ Deferred to 5B |

---

## 5. Failure Modes and Recovery

### 5.1 Known Failure Modes

| Component | Failure Mode | Current Handling | Recovery |
|-----------|--------------|------------------|----------|
| Google CSE | Quota exhausted | Error shown in UI | Wait for quota reset |
| Google CSE | API unavailable | Error shown in UI | Retry manually |
| Database | Connection lost | 500 error | Auto-reconnect (Prisma) |
| Authentication | Session expired | Redirect to login | Re-authenticate |
| CSV Import | Invalid data | Row-level errors | Show errors, partial import |

### 5.2 Planned Failure Handling (Phase 5+)

| Component | Failure Mode | Planned Handling |
|-----------|--------------|------------------|
| Discovery | Channel unavailable | Continue with other channels |
| Discovery | Quota exhausted | Alert, try next day |
| Webhook | Invalid signature | Reject, log attempt |
| Webhook | Parse error | Log, retry with backoff |
| Message Send | API error | Mark failed, notify user |
| Autopilot | Rate limited | Queue for later |

---

## 6. Data Ownership and Flow

### 6.1 Data Models and Ownership

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA MODEL RELATIONSHIPS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐       │
│  │ COMPANY  │ 1───M   │ CONTACT  │ 1───M   │   LEAD   │       │
│  │          │─────────│          │─────────│          │       │
│  │ - name   │         │ - name   │         │ - email  │       │
│  │ - website│         │ - email  │         │ - status │       │
│  │ - score  │         │ - phone  │         │ - score  │       │
│  └──────────┘         └──────────┘         └──────────┘       │
│       │                                          │             │
│       │                                          │             │
│       └───────────────────────────────M──────────┘             │
│                                                                 │
│  FUTURE (Phase 6):                                             │
│                                                                 │
│  ┌──────────────┐     ┌──────────┐     ┌──────────────┐       │
│  │ CHANNEL      │ 1─M │ CONVER-  │ 1─M │   MESSAGE    │       │
│  │ ACCOUNT      │─────│ SATION   │─────│              │       │
│  │              │     │          │     │ - content    │       │
│  │ - provider   │     │ - leadId │     │ - direction  │       │
│  │ - credentials│     │ - status │     │ - status     │       │
│  └──────────────┘     └──────────┘     └──────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow

**Current Flow:**
```
CSV Import → Company/Contact/Lead → Enrichment → Scoring → Manual Management
```

**Target Flow (Phase 6+):**
```
Discovery → Company/Contact/Lead → Enrichment → Scoring → Brain Recommendation
                                                              ↓
Message Ingestion → Conversation/Message → Identity Resolution → Inbox
                                                              ↓
                                           Reply (Human) → Send → Delivery Status
                                                              ↓
                                           Autopilot (Controlled) → Audit Log
```

---

## 7. Integration Points

### 7.1 Current Integrations

| Integration | Type | Purpose | Status |
|-------------|------|---------|--------|
| Google CSE | API | Company enrichment | ✅ Active |
| Prisma/PostgreSQL | Database | Data storage | ✅ Active |
| NextAuth | Library | Authentication | ✅ Active |
| Vercel | Platform | Hosting | ✅ Active |

### 7.2 Planned Integrations

| Integration | Type | Purpose | Phase |
|-------------|------|---------|-------|
| Respond.io | Webhook + API | Omnichannel messaging | 6A |
| Gmail | API | Direct email (future) | Post-6 |
| WhatsApp Cloud | API | Direct WhatsApp (future) | Post-6 |
| Vercel Cron | Scheduler | Discovery automation | 5A |

### 7.3 Explicitly NOT Planned

| Integration | Reason |
|-------------|--------|
| LinkedIn Messaging | API not available, TOS restrictions |
| HubSpot | Replaced by built-in CRM |
| Salesforce | Not needed for current scale |

---

## 8. AI and LLM Usage Policy

### Principles: LLMs Are Tools, Not Decision-Makers

The CCS Lead Agent may use Large Language Models (LLMs) and other AI technologies as **tools to assist** human operators, not as autonomous decision-makers.

### Permitted Uses (Current and Future)

| Use Case | Phase | Human Oversight |
|----------|-------|-----------------|
| Draft message suggestions | 6B | Human reviews and clicks Send |
| Summarize conversation history | 6B | Human reviews summary |
| Extract structured data from text | 5B+ | Rules validate extraction |
| Suggest reply templates | 6B | Human selects template |
| Score/classify text sentiment | 8 | Deterministic rules apply results |

### Prohibited Uses

| Use Case | Reason |
|----------|--------|
| Autonomous message sending based on LLM output | Risk of inappropriate communication |
| Fully AI-generated personalized messages | Lack of deterministic control |
| AI-only lead qualification decisions | Business decisions require human oversight |
| Unrestricted prompt injection scenarios | Security risk |

### Control Boundaries

1. **LLM outputs are suggestions, not actions** — A human or deterministic rule must approve
2. **Templates over generation** — Prefer structured templates with variable substitution over free-form generation
3. **Audit trail for AI usage** — Log when AI assistance is used and what it produced
4. **Fallback to rules** — If AI service is unavailable, system continues with rule-based logic
5. **No hidden AI** — Users should know when AI is involved in producing content

### Why This Matters

- **Predictability:** Deterministic rules are easier to debug and explain
- **Safety:** Bounded automation prevents runaway actions
- **Compliance:** Auditable decisions support regulatory requirements
- **Trust:** Users trust what they can understand and control

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **Lead** | A potential customer record with contact info and status |
| **Contact** | A person at a company, may be associated with leads |
| **Company** | A business entity, may have multiple contacts and leads |
| **Conversation** | A thread of messages with a participant (future) |
| **Message** | A single communication within a conversation (future) |
| **Channel** | Communication medium (email, WhatsApp, Instagram, etc.) |
| **Channel Account** | A connected account for sending/receiving on a channel |
| **Discovery** | Process of finding new prospects automatically |
| **Enrichment** | Process of adding data to company records |
| **Scoring** | Process of rating leads/companies by quality |
| **ICP** | Ideal Customer Profile - target prospect characteristics |
| **Autopilot** | Controlled automatic message replies |
| **Kill Switch** | Emergency disable for all automation |
| **LLM** | Large Language Model - AI tool for text generation/analysis |
| **Deterministic Rules** | Fixed if-then logic that produces predictable outputs |

---

## 10. Version History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-11 | 1.0 | System | Initial document creation |
| 2026-01-11 | 1.1 | System | Added agent identity principles, LLM usage policy |
| 2026-01-11 | 1.2 | System | Updated discovery status to reflect Phase 5A in progress |

---

## 11. Appendices

### Appendix A: Phase Feature Mapping

| Feature | Phase | Document |
|---------|-------|----------|
| Authentication | Pre-1 | PHASE_Status_Report.md |
| Database Setup | Pre-1 | PHASE_Status_Report.md |
| Lead/Contact/Company CRUD | 4 | PHASE_4_LEAD_MANAGEMENT_MVP.md |
| Lead Status/Ownership/Notes | 4 | PHASE_4_LEAD_MANAGEMENT_DESIGN.md |
| Bulk Operations | 4B | PHASE_4B_TESTING.md |
| Discovery Architecture | 1 | PHASE_1_Discovery_Design_Locked.md |
| Discovery Execution | 5A | ROADMAP_V2_PHASES_5_TO_8.md |
| Brain/Policy Layer | 5B | ROADMAP_V2_PHASES_5_TO_8.md |
| Enrichment | 2 | PHASE_2_ENRICHMENT_DESIGN.md |
| Scoring | 3 | PHASE_Status_Report.md |
| Messaging Foundation | 6A | PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md |
| Assisted Replies | 6B | PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md |
| Controlled Autopilot | 6C | PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md |
| Playbooks/Sequences | 7 | ROADMAP_V2_PHASES_5_TO_8.md |
| Learning Loops | 8 | ROADMAP_V2_PHASES_5_TO_8.md |

### Appendix B: Document Update Checklist

When implementing a new feature, update this document:

- [ ] Section 1: Add to "What the Lead Agent Does Today"
- [ ] Section 2: Remove from "What it Does NOT Do Yet"
- [ ] Section 3: Update operating loop status
- [ ] Section 4: Add any new guardrails
- [ ] Section 5: Document new failure modes
- [ ] Section 6: Update data model diagram if schema changed
- [ ] Section 7: Add any new integrations
- [ ] Section 8: Update AI/LLM policy if AI usage changes
- [ ] Section 10: Add version history entry
- [ ] Section 11: Update phase feature mapping

---

**Document Owner:** Project Lead  
**Review Frequency:** After each phase completion  
**Last Review:** January 11, 2026

# Phase Status Matrix

> **Status:** Living Document  
> **Created:** January 11, 2026  
> **Last Updated:** January 13, 2026  
> **Purpose:** Track completion status of all phases at a glance  
> **What Changed:** Added Phase 5B (Brain + Assisted Outreach), updated Phase 6 with Respond.io MVP scope

---

## Quick Reference

| Phase | Status | Completion |
|-------|--------|------------|
| 1 - Discovery | ✅ Complete | 90% |
| 2 - Enrichment | ✅ Complete | 70% |
| 3 - Scoring | ✅ Complete | 80% |
| 4 - Lead Management | ✅ Complete | 90% |
| 5A - Autonomous Discovery | ✅ Complete | 100% |
| 5B - Brain/Policy + Assisted Outreach | ✅ Complete | 100% |
| 6A - Omnichannel Foundation (Respond.io) | ❌ Planned | 0% |
| 6B - Assisted Replies | ❌ Planned | 0% |
| 6C - Controlled Autopilot | ❌ Planned | 0% |
| 7 - Playbooks | ❌ Future | 0% |
| 8 - Learning | ❌ Future | 0% |

---

## Detailed Phase Status

### Phase 1: Discovery

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete |
| **Completion** | 90% |
| **Key Features Included** | Google search channel, keyword discovery, website signal extraction, discovery metadata storage, prospect deduplication logic |
| **Key Exclusions** | LinkedIn/social execution (interfaces only) |
| **Documentation** | [PHASE_1_Discovery_Design_Locked.md](./PHASE_1_Discovery_Design_Locked.md), [PHASE_1_Discovery_MVP_Definition.md](./PHASE_1_Discovery_MVP_Definition.md), [PHASE_1_Discovery_Constraints.md](./PHASE_1_Discovery_Constraints.md) |
| **Notes/Risks** | Phase 5A added execution mechanism. Discovery architecture fully operational. |

---

### Phase 2: Enrichment

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete |
| **Completion** | 70% |
| **Key Features Included** | Google CSE integration, website metadata extraction, enrichment status tracking, enrichment data storage, company enrichment API, enrichment UI |
| **Key Exclusions** | LinkedIn enrichment, Crunchbase enrichment, client profile matching, batch enrichment, scheduled enrichment |
| **Documentation** | [PHASE_2_ENRICHMENT_DESIGN.md](./PHASE_2_ENRICHMENT_DESIGN.md), [PHASE_2_ENRICHMENT_MVP.md](./PHASE_2_ENRICHMENT_MVP.md), [PHASE_2_ENRICHMENT_CONSTRAINTS.md](./PHASE_2_ENRICHMENT_CONSTRAINTS.md) |
| **Notes/Risks** | Depends on Google CSE API key configuration. Additional enrichment sources deferred. |

---

### Phase 3: Scoring

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete |
| **Completion** | 80% |
| **Key Features Included** | Lead scoring (0-100), company scoring (0-100), scoring factors (status, source, country, size, industry), classification (hot/warm/cold), score recalculation API, scoring UI |
| **Key Exclusions** | Similarity-based scoring, order potential estimation, CCS client profile matching, industry-specific classification |
| **Documentation** | [PHASE_Status_Report.md](./PHASE_Status_Report.md) (Section: Phase 4), [lib/scoring.ts](./lib/scoring.ts) |
| **Notes/Risks** | Current scoring is rule-based only. ML-based scoring deferred to Phase 8. |

---

### Phase 4: Lead Management

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete |
| **Completion** | 90% |
| **Key Features Included** | Lead status management, lead ownership assignment, internal notes (CRUD), bulk operations (status, owner), enhanced filtering (status, owner, score, source, classification), lead detail page enhancements |
| **Key Exclusions** | Orders tracking, activity logs/audit trails, saved filter presets, status history tracking |
| **Documentation** | [PHASE_4_LEAD_MANAGEMENT_DESIGN.md](./PHASE_4_LEAD_MANAGEMENT_DESIGN.md), [PHASE_4_LEAD_MANAGEMENT_MVP.md](./PHASE_4_LEAD_MANAGEMENT_MVP.md), [PHASE_4_VERIFICATION_AND_PLAN.md](./PHASE_4_VERIFICATION_AND_PLAN.md) |
| **Notes/Risks** | Core CRM functionality complete. Orders system needed for advanced features. |

---

### Phase 5A: Autonomous Daily Discovery

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete |
| **Completion** | 100% |
| **Key Features Included** | Daily scheduling via Vercel Cron (06:00 UTC), Manual discovery with 5 intent templates (agencies_all, schools_all, tenders_uniforms_merch, businesses_sme_ceo_and_corporate_marketing, events_exhibitions_sa), DiscoveryRun tracking model, budget/quota management, safety guardrails (kill switch, time budgets, max limits: manual 20/30/5, daily 30/30/5), idempotency via existing deduplication, dry-run mode, run history UI, admin-only Discovery UI at /dashboard/discovery, global negative keywords (jobs/vacancies/retail filtering), Gauteng-first geography bias, tender site constraint (site:etenders.gov.za) |
| **Key Exclusions** | Real-time discovery, discovery result approval workflow, alerting (deferred to 5B) |
| **Documentation** | [PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md), [PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md), [PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md), [PHASE_5A_TESTING.md](./PHASE_5A_TESTING.md) |
| **Notes/Risks** | Uses Vercel Cron. No outreach. No LLM brain. Production-ready. |

**Phase 5A Completed Items:**
- [x] Constraints documentation
- [x] Technical design documentation
- [x] MVP definition documentation
- [x] DiscoveryRun Prisma model + migration
- [x] DailyDiscoveryRunner with safety guardrails
- [x] Secured cron job API route (`/api/jobs/discovery/run`)
- [x] Manual discovery API route (`/api/discovery/manual/run`)
- [x] Intent templates (5 required CCS-aligned: agencies_all, schools_all, tenders_uniforms_merch, businesses_sme_ceo_and_corporate_marketing, events_exhibitions_sa)
- [x] Global negative keywords (jobs/vacancies/retail filtering)
- [x] Tender site constraint (site:etenders.gov.za)
- [x] Gauteng-first geography bias
- [x] Manual limit safety caps (maxCompanies≤20, maxLeads≤30, maxQueries≤5)
- [x] Vercel cron configuration (`vercel.json`)
- [x] Run history UI (`/dashboard/discovery-runs`)
- [x] Manual discovery UI (`/dashboard/discovery`)
- [x] Test scripts (`scripts/test-discovery-runner.ts`, `scripts/verify-discovery-intents.ts`)
- [x] Kill switch (DISCOVERY_RUNNER_ENABLED)
- [x] Time budgets (graceful stop)
- [x] Max limits (companies, leads, queries)
- [x] Safe channel error handling

---

### Phase 5B: Policy/Knowledge Brain + Assisted Outreach

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ Complete |
| **Completion** | 100% |
| **Key Features Included** | Assisted outreach (Yolande Formula) with 5 playbooks, draft generation, editing, approval workflow, outreach queue UI at `/dashboard/outreach`, suppression lists, rate limiting, cooldown periods, sending disabled by default, email sending placeholder (ready for provider integration) |
| **Key Exclusions** | ICP rules UI, allow/block lists UI, policy configuration UI (deferred to future), autonomous message sending, ML/AI recommendations |
| **Documentation** | [PHASE_5B_ASSISTED_OUTREACH_IMPLEMENTATION.md](./PHASE_5B_ASSISTED_OUTREACH_IMPLEMENTATION.md), [PHASE_5B_ASSISTED_OUTREACH_MVP.md](./PHASE_5B_ASSISTED_OUTREACH_MVP.md), [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) |
| **Notes/Risks** | All outreach requires human approval. No autonomous execution. Email sending is placeholder - needs provider integration (SMTP/Resend/SendGrid). |

---

### Phase 6A: Omnichannel Messaging Foundation (Respond.io - Read-Only)

| Attribute | Value |
|-----------|-------|
| **Status** | ❌ Planned |
| **Completion** | 0% |
| **Key Features Included** | (Planned) Conversation data model, message data model, channel account model, Respond.io webhook ingestion, identity resolution v1, unified inbox UI, conversation timeline, read-only mode |
| **Key Exclusions** | Sending messages, auto-replies, direct channel connections (Gmail, WhatsApp Cloud), file storage |
| **Documentation** | [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md), [PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md](./PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md), [OMNICHANNEL_DATA_MODEL.md](./OMNICHANNEL_DATA_MODEL.md), [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) (Phase 6A section) |
| **Notes/Risks** | Respond.io is primary integration. LinkedIn messaging NOT supported (API limitations). Phase 6A is read-only - no sending capability. |

---

### Phase 6B: Assisted Replies (Human-in-the-Loop)

| Attribute | Value |
|-----------|-------|
| **Status** | ❌ Planned |
| **Completion** | 0% |
| **Key Features Included** | (Planned) Reply composer UI, draft suggestions, manual send button, attachments for email, message templates, outbound message logging |
| **Key Exclusions** | Auto-send, scheduled sends, bulk messaging |
| **Documentation** | [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md), [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) (Phase 6B section) |
| **Notes/Risks** | All sends require human approval (click to send). |

---

### Phase 6C: Controlled Autopilot

| Attribute | Value |
|-----------|-------|
| **Status** | ❌ Planned |
| **Completion** | 0% |
| **Key Features Included** | (Planned) Opt-in per conversation, segment-based autopilot, rate limits, quiet hours, global kill switch, audit log, escalation rules |
| **Key Exclusions** | Free-form AI replies, unsolicited outreach, cross-conversation campaigns |
| **Documentation** | [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md), [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) (Phase 6C section) |
| **Notes/Risks** | Strict guardrails required. Template-only responses. |

---

### Phase 7: Multi-Step Playbooks / Sequences

| Attribute | Value |
|-----------|-------|
| **Status** | ❌ Future |
| **Completion** | 0% |
| **Key Features Included** | (Future) Playbook definition, enrollment rules, step conditions, exit conditions, compliance checks, A/B testing |
| **Key Exclusions** | TBD based on Phase 6 learnings |
| **Documentation** | [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) (Phase 7 section) |
| **Notes/Risks** | Requires stable Phase 6. Admin approval required for all playbooks. |

---

### Phase 8: Learning & Improvement Loops

| Attribute | Value |
|-----------|-------|
| **Status** | ❌ Future |
| **Completion** | 0% |
| **Key Features Included** | (Future) Outcome tracking, discovery quality scoring, message effectiveness, rule optimization suggestions, scoring calibration, forecasting |
| **Key Exclusions** | TBD - requires sufficient historical data |
| **Documentation** | [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) (Phase 8 section) |
| **Notes/Risks** | Requires 6+ months of data. Orders system integration needed. |

---

## Pre-Phase Infrastructure

These were implemented before the numbered phase system:

| Component | Status | Notes |
|-----------|--------|-------|
| Authentication | ✅ Complete | NextAuth.js, domain-restricted |
| Database Setup | ✅ Complete | PostgreSQL, Prisma ORM |
| Hydration Fix | ✅ Complete | React hydration issues resolved |
| Dashboard | ✅ Complete | Basic metrics and navigation |
| CSV Import | ✅ Complete | Companies, contacts, leads |

---

## Implementation Dependencies

```
Phase 1 ─────────────────────────────────────────────────┐
                                                          │
Phase 2 ───────────────────────┐                         │
                               │                         │
Phase 3 ───────────────────────┼─────────────────────────┤
                               │                         │
Phase 4 ───────────────────────┘                         │
                                                          │
                                                          ▼
Phase 5A (Discovery Execution) ◄─────────────────────────┘
        │
        ▼
Phase 5B (Brain/Policy)
        │
        ▼
Phase 6A (Messaging Read-Only)
        │
        ▼
Phase 6B (Assisted Replies) ◄─── Phase 5B (suggestions)
        │
        ▼
Phase 6C (Controlled Autopilot) ◄─── Phase 5B (rules)
        │
        ▼
Phase 7 (Playbooks)
        │
        ▼
Phase 8 (Learning) ◄─── All previous phases + Orders system
```

---

## Risk Summary

| Risk | Affected Phases | Mitigation |
|------|-----------------|------------|
| LinkedIn API limitations | 6A, 6B | Focus on Respond.io; LinkedIn is display-only |
| Respond.io API changes | 6A, 6B, 6C | Connector architecture allows provider switch |
| Google CSE quota | 2, 5A | Budget management, alerting |
| Autopilot misuse | 6C, 7 | Kill switch, rate limits, audit logging |
| Data quality | 5A | Deduplication, validation, human review queue |
| Compliance (POPIA/GDPR) | 6B, 6C | Consent tracking, opt-out handling (future) |

---

## Next Actions

Based on current status, recommended next implementation:

### Recommended Sequence
1. **Phase 5B** (2 weeks) - Brain/policy layer (ICP rules, allow/block lists)
2. **Phase 6A** (3 weeks) - Unified inbox, message ingestion via Respond.io
3. **Phase 6B** (2 weeks) - Reply capability with templates
4. **Phase 6C** (2 weeks) - Controlled autopilot with guardrails

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-01-11 | Initial matrix creation |
| 2026-01-11 | Phase 5A marked as In Progress (25%); added completed items checklist |
| 2026-01-11 | Phase 5A implementation complete (90%); pending: manual verification + deployment |
| 2026-01-11 | **Phase 5A marked as Complete (100%)**; added manual discovery with intents, safety guardrails |
| 2026-01-13 | Updated Phase 5B to include Assisted Outreach (Yolande Formula); updated Phase 6A with Respond.io MVP scope and new documentation |
| 2026-01-14 | Phase 5B marked as Complete (100%) - Assisted Outreach implementation complete with playbooks, drafts, approval workflow, and safety guardrails |

---

## Related Documents

- [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) - Phase definitions
- [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md) - Messaging architecture
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Living system definition
- [VISION_GAP_ANALYSIS.md](./VISION_GAP_ANALYSIS.md) - Gap analysis
- [RELEASE_GATE_PHASES_1_TO_4.md](./RELEASE_GATE_PHASES_1_TO_4.md) - Phase 1-4 verification

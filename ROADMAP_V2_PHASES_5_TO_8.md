# Roadmap v2: Phases 5–8

> **Status:** Living Document  
> **Created:** January 11, 2026  
> **Last Updated:** January 13, 2026  
> **Supersedes:** Previous Phase 5–7 references in VISION_GAP_ANALYSIS.md and PHASE_Status_Report.md  
> **What Changed:** Added assisted outreach (Yolande Formula) to Phase 5B, updated Phase 6 with Respond.io-first approach, added handoff workflows

---

## Document Purpose

This document defines the revised roadmap for CCS Lead Agent v2, phases 5 through 8. It replaces the previously vague references to "Phase 5: Outreach" and "Phase 6: Operations Console" with a comprehensive, incremental plan that supports:

1. **Daily autonomous discovery** with safe guardrails
2. **Policy/Knowledge Brain** for intelligent action planning
3. **Omnichannel messaging** (Email, WhatsApp, Instagram, Facebook via Respond.io first)
4. **Human-in-the-loop safety** before any autonomous messaging

### Design Principles

- **Incremental rollout**: Read-only first → Assisted → Controlled autopilot
- **Safety first**: No autonomous messaging without explicit opt-in and kill switches
- **Extensibility**: Connector architecture for future channel additions
- **Auditability**: Complete message trail and action logging
- **Compliance**: Respect quiet hours, rate limits, and platform terms

---

## Phase Overview

| Phase | Name | Status | Focus | Autonomous Messaging? |
|-------|------|--------|-------|----------------------|
| 5A | Autonomous Daily Discovery | ✅ Complete | Scheduled discovery runs | No |
| 5B | Policy/Knowledge Brain + Assisted Outreach | Planned | ICP + rules + action planning + outreach templates | No (human approval required) |
| 6A | Omnichannel Foundation (Respond.io - Read-only) | Planned | Ingest conversations via Respond.io | No |
| 6B | Assisted Replies (Human-in-loop) | Planned | Draft suggestions, manual send | No |
| 6C | Controlled Autopilot | Planned | Opt-in auto-reply, guardrails | Yes (restricted) |
| 7 | Multi-step Playbooks | Future | Sequences + campaigns | Yes (restricted) |
| 8 | Learning & Improvement | Future | Outcome tracking + optimization | N/A |

---

## Phase 5A: Autonomous Daily Discovery

**Goal:** Transform the existing Phase 1 discovery architecture into a scheduled, autonomous system that runs daily to find new prospects.

### Scope

#### In Scope
- **Daily scheduling via cron** (Vercel Cron Jobs or external scheduler)
- **Discovery run tracking** (run ID, start time, end time, status)
- **Budget/quota management** (max searches per day, cost limits)
- **Idempotency** (prevent duplicate prospects within same run)
- **Failure handling** (retry logic, partial failure tolerance)
- **Alerting** (email/Slack notification on failures or quota exhaustion)
- **Run history** (last N runs visible in dashboard)

#### Out of Scope
- Real-time discovery (stays batch-based daily)
- User-triggered discovery (manual trigger is Phase 4B scope if needed)
- Discovery result approval workflow (prospects created immediately)

### Data Model Changes (Spec Only)

```text
DiscoveryRun
├── id: String (cuid)
├── status: Enum (pending, running, completed, failed, partial)
├── startedAt: DateTime
├── completedAt: DateTime?
├── configuration: Json (queries, channels enabled, limits)
├── results: Json (counts, errors, quota used)
├── triggeredBy: String (cron | manual | api)
├── createdAt: DateTime
├── updatedAt: DateTime

Indexes:
├── @@index([status])
├── @@index([startedAt])
└── @@index([triggeredBy])
```

### API Endpoints (Spec Only)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/discovery/run` | Trigger discovery run (cron or manual) |
| GET | `/api/discovery/runs` | List recent discovery runs |
| GET | `/api/discovery/runs/[id]` | Get run details |
| POST | `/api/discovery/config` | Update discovery configuration |
| GET | `/api/discovery/config` | Get current configuration |

### Configuration Schema

```typescript
interface DiscoveryConfiguration {
  enabled: boolean;
  schedule: {
    cronExpression: string; // e.g., "0 6 * * *" (6 AM daily)
    timezone: string;       // e.g., "Africa/Johannesburg"
  };
  channels: {
    googleSearch: { enabled: boolean; maxQueries: number; };
    linkedIn: { enabled: boolean; maxProfiles: number; };
    keyword: { enabled: boolean; keywords: string[]; };
    social: { enabled: boolean; platforms: string[]; };
  };
  limits: {
    maxCompaniesPerRun: number;
    maxLeadsPerRun: number;
    dailyBudgetUsd: number;
  };
  alerts: {
    onFailure: boolean;
    onQuotaWarning: boolean;
    notifyEmails: string[];
  };
}
```

### Success Criteria
- [ ] Discovery runs daily at configured time
- [ ] No duplicate prospects created within same day
- [ ] Failures don't block subsequent runs
- [ ] Quota tracked and alerts sent at 80%+ usage
- [ ] Run history visible in admin dashboard

### Dependencies
- Phase 1 discovery architecture (complete)
- Vercel Cron Jobs or external scheduler (infrastructure)

---

## Phase 5B: Policy/Knowledge Brain + Assisted Outreach

**Goal:** Create a deterministic rules engine that defines the Ideal Customer Profile (ICP), allow/block lists, generates action recommendations, and provides assisted outreach message generation (Yolande Formula) WITHOUT autonomous execution.

### Scope

#### In Scope
- **ICP definition** (industry, size, country, keywords)
- **Allow/block lists** (domains, companies, contacts)
- **Deterministic rules engine** (if-then rules, no ML)
- **Action planner output** (recommended next actions for leads)
- **Policy configuration UI** (admin-only)
- **Action queue** (recommendations stored, not executed)
- **Assisted Outreach (Yolande Formula):**
  - Message generator with templates
  - Context-aware suggestions (lead/company, intent, event context)
  - Social proof integration (Standard Bank PPBSA, Vodacom, ISUZU, etc.)
  - Catalog/portfolio link placeholders
  - **Human approval required** before sending
  - Rate limits and suppression lists
  - Opt-out handling

#### Out of Scope
- Autonomous message sending (Phase 6C)
- Machine learning or AI recommendations (Phase 8)
- Outreach execution without human approval (all outreach requires approval)
- LinkedIn messaging automation (manual copy-paste only)

### Data Model Changes (Spec Only)

```text
PolicyRule
├── id: String (cuid)
├── name: String
├── description: String?
├── type: Enum (icp_match, block, allow, action_recommend)
├── conditions: Json (rule conditions)
├── actions: Json (recommended actions if conditions met)
├── priority: Int (higher = evaluated first)
├── enabled: Boolean
├── createdAt: DateTime
├── updatedAt: DateTime

ActionRecommendation
├── id: String (cuid)
├── leadId: String (FK to Lead)
├── ruleId: String (FK to PolicyRule)
├── recommendedAction: Enum (contact, skip, enrich, escalate, nurture)
├── channel: String? (email, whatsapp, phone, linkedin)
├── reasoning: String (why this action was recommended)
├── confidence: Float (0-1, rule certainty)
├── status: Enum (pending, approved, rejected, executed, expired)
├── approvedBy: String? (FK to User)
├── approvedAt: DateTime?
├── expiresAt: DateTime
├── createdAt: DateTime

AllowBlockEntry
├── id: String (cuid)
├── type: Enum (allow, block)
├── entityType: Enum (domain, company, contact, email, phone)
├── value: String (the blocked/allowed value)
├── reason: String?
├── createdBy: String (FK to User)
├── createdAt: DateTime
```

### Rules Engine Design

```typescript
interface RuleCondition {
  field: string;           // e.g., "lead.country", "company.industry"
  operator: "eq" | "neq" | "contains" | "gt" | "lt" | "in" | "not_in" | "matches";
  value: any;
}

interface PolicyRuleDefinition {
  name: string;
  conditions: RuleCondition[];
  conditionLogic: "AND" | "OR";
  action: {
    type: "recommend_contact" | "recommend_skip" | "mark_hot" | "block" | "allow";
    channel?: string;
    template?: string;
    reason: string;
  };
}

// Example ICP Rule:
{
  name: "South Africa Corporate 200+ Employees",
  conditions: [
    { field: "company.country", operator: "eq", value: "South Africa" },
    { field: "company.size", operator: "gt", value: 200 },
    { field: "company.industry", operator: "in", value: ["Manufacturing", "Retail", "Events"] }
  ],
  conditionLogic: "AND",
  action: {
    type: "recommend_contact",
    channel: "email",
    reason: "Matches ICP: SA corporate, large company, target industry"
  }
}
```

### Action Planner Output Format

```typescript
interface ActionPlannerResult {
  leadId: string;
  evaluatedAt: string;      // ISO timestamp
  matchedRules: string[];   // Rule IDs that matched
  recommendation: {
    action: "contact" | "skip" | "enrich" | "escalate" | "nurture";
    priority: "high" | "medium" | "low";
    channel?: string;
    reasoning: string;
    suggestedMessage?: string;  // Template or draft
  };
  blockedBy?: string;         // Block rule ID if blocked
  manualReviewRequired: boolean;
}
```

### Success Criteria
- [ ] ICP rules definable via admin UI
- [ ] Allow/block lists manageable via admin UI
- [ ] Action recommendations generated for all leads
- [ ] Recommendations visible in lead detail page
- [ ] Outreach message generator creates suggested messages
- [ ] Outreach templates available (Agencies, Schools, Businesses, Events)
- [ ] Human approval required for all outreach messages
- [ ] Rate limits enforced
- [ ] Suppression lists checked before sending
- [ ] No autonomous execution (approve/reject workflow required)

### Dependencies
- Phase 4 lead management (complete)

---

## Phase 6A: Omnichannel Messaging Foundation (Respond.io - Read-Only)

**Goal:** Ingest conversations from Respond.io (Email, WhatsApp, Instagram, Facebook) into a unified conversation model. Read-only ingestion with no sending capability. Respond.io is the first integration target.

### Scope

#### In Scope
- **Conversation data model** (unified across channels)
- **Message data model** (with channel-specific metadata)
- **ChannelAccount model** (connected accounts/integrations)
- **Webhook ingestion** (receive messages from Respond.io)
- **Identity resolution v1** (match messages to existing contacts/leads)
- **Unified inbox UI** (read-only view of all conversations)
- **Conversation timeline** (messages + notes + activities)
- **Attachment metadata storage** (no file storage in Phase 6A)

#### Out of Scope
- Sending messages (Phase 6B)
- Auto-replies (Phase 6C)
- Direct channel connections (Gmail, WhatsApp Cloud API) - deferred
- File/attachment storage (only metadata in Phase 6A)

### Connector Architecture

See **PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md** and **PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md** for full specification including:
- `IChannelConnector` interface
- Respond.io connector implementation (first)
- Provider implementation plan (Gmail, WhatsApp Cloud, Meta Business - future)
- Identity resolution strategy
- Timeline threading rules
- Canonical data model (see **OMNICHANNEL_DATA_MODEL.md**)

### Data Model Changes (Spec Only)

```text
Conversation
├── id: String (cuid)
├── externalId: String? (external platform conversation ID)
├── channelType: Enum (email, whatsapp, instagram, facebook, sms, other)
├── channelAccountId: String (FK to ChannelAccount)
├── status: Enum (open, closed, snoozed, archived)
├── leadId: String? (FK to Lead)
├── contactId: String? (FK to Contact)
├── companyId: String? (FK to Company)
├── participantIdentities: Json (resolved participants)
├── subject: String? (for email)
├── lastMessageAt: DateTime
├── lastMessagePreview: String
├── unreadCount: Int
├── assignedToId: String? (FK to User)
├── tags: String[]
├── metadata: Json (channel-specific data)
├── createdAt: DateTime
├── updatedAt: DateTime

Message
├── id: String (cuid)
├── conversationId: String (FK to Conversation)
├── externalMessageId: String (for deduplication)
├── direction: Enum (inbound, outbound)
├── senderType: Enum (lead, contact, user, system, bot)
├── senderId: String? (FK to User if outbound by user)
├── content: String
├── contentType: Enum (text, html, image, file, audio, video, location, template)
├── status: Enum (pending, sent, delivered, read, failed)
├── errorMessage: String?
├── attachments: Json (attachment metadata array)
├── replyToMessageId: String? (for threading)
├── sentAt: DateTime
├── deliveredAt: DateTime?
├── readAt: DateTime?
├── channelMetadata: Json (platform-specific fields)
├── createdAt: DateTime

ChannelAccount
├── id: String (cuid)
├── provider: Enum (respond_io, gmail, ms365, whatsapp_cloud, meta_business)
├── channelType: Enum (email, whatsapp, instagram, facebook, sms)
├── name: String (display name)
├── accountIdentifier: String (email address, phone number, page ID)
├── credentials: Json (encrypted tokens/keys)
├── webhookSecret: String?
├── status: Enum (active, inactive, error, disconnected)
├── lastSyncAt: DateTime?
├── syncError: String?
├── configuration: Json (account-specific settings)
├── createdAt: DateTime
├── updatedAt: DateTime

Attachment (metadata only)
├── id: String (cuid)
├── messageId: String (FK to Message)
├── filename: String
├── mimeType: String
├── sizeBytes: Int
├── externalUrl: String? (URL from provider)
├── storageUrl: String? (our storage, if downloaded)
├── thumbnailUrl: String?
├── metadata: Json
├── createdAt: DateTime
```

### Webhook Endpoints (Spec Only)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/webhooks/respond-io` | Receive Respond.io webhooks |
| POST | `/api/webhooks/[provider]` | Generic webhook handler |

### UI Components (Spec Only)

- **Unified Inbox** (`/dashboard/inbox`)
  - List of conversations across all channels
  - Filter by channel, status, assigned user
  - Search by contact/company/content
- **Conversation View** (`/dashboard/inbox/[conversationId]`)
  - Message timeline (chronological)
  - Participant info sidebar
  - Related lead/contact/company links
  - Internal notes (separate from messages)
- **Inbox Settings** (`/dashboard/settings/inbox`)
  - Connected channel accounts
  - Webhook configuration

### Success Criteria
- [ ] Respond.io webhook receives messages
- [ ] Webhook signature verification works
- [ ] Messages stored in unified Message model
- [ ] Identity resolution matches to existing contacts (v1)
- [ ] Unified inbox displays all conversations
- [ ] Conversation timeline shows message history
- [ ] Channel indicators show correct channel (Email, WhatsApp, Instagram, Facebook)
- [ ] No sending capability (read-only enforced)

### Dependencies
- Respond.io account with API access and webhook capability
- Phase 4 lead management (complete)
- Phase 5B (optional) - Brain can inform conversation assignment and context

---

## Phase 6B: Assisted Replies (Human-in-the-Loop)

**Goal:** Enable team members to compose and send replies through the unified inbox, with AI-assisted draft suggestions. ALL sends require human approval.

### Scope

#### In Scope
- **Reply composer UI** (rich text for email, plain for messaging)
- **Draft suggestions** (template-based, rule-based)
- **Manual send button** (user must click to send)
- **Attachments for email** (file upload + send)
- **Message templates** (saved responses, variables)
- **Outbound message logging** (track all sent messages)
- **Send confirmations** (delivery status tracking)

#### Out of Scope
- Auto-send (Phase 6C)
- Scheduled sends (Phase 6B is immediate only)
- Bulk messaging (single conversation at a time)

### Data Model Changes (Spec Only)

```text
MessageTemplate
├── id: String (cuid)
├── name: String
├── channelTypes: String[] (applicable channels)
├── subject: String? (for email)
├── content: String (with {{variable}} placeholders)
├── variables: Json (available variables)
├── category: String?
├── createdBy: String (FK to User)
├── createdAt: DateTime
├── updatedAt: DateTime

MessageDraft
├── id: String (cuid)
├── conversationId: String (FK to Conversation)
├── authorId: String (FK to User)
├── content: String
├── suggestedBy: String? (template_id, brain, manual)
├── status: Enum (draft, sent, discarded)
├── sentMessageId: String? (FK to Message after send)
├── createdAt: DateTime
├── updatedAt: DateTime
```

### API Endpoints (Spec Only)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/conversations/[id]/reply` | Send a reply (requires auth) |
| GET | `/api/conversations/[id]/suggestions` | Get draft suggestions |
| GET | `/api/templates` | List message templates |
| POST | `/api/templates` | Create message template |
| PATCH | `/api/templates/[id]` | Update template |
| DELETE | `/api/templates/[id]` | Delete template |

### Success Criteria
- [ ] Reply composer visible in conversation view
- [ ] Templates loadable into composer
- [ ] Send button triggers actual message send
- [ ] Outbound messages appear in timeline
- [ ] Delivery status tracked and displayed
- [ ] Attachments uploadable and sent (email)

### Dependencies
- Phase 6A (conversations + messages model)
- Respond.io send API access

---

## Phase 6C: Controlled Autopilot

**Goal:** Enable opt-in automated replies for specific conversations or segments, with strict guardrails, rate limits, and kill switches.

### Scope

#### In Scope
- **Opt-in per conversation** (explicit toggle, off by default)
- **Segment-based autopilot** (e.g., "all initial inquiries")
- **Low-risk auto-replies only** (predefined responses)
- **Rate limits** (max messages per hour/day per account)
- **Quiet hours** (no sends during specified times)
- **Global kill switch** (admin can disable all autopilot instantly)
- **Auto-reply audit log** (full trail of automated sends)
- **Escalation rules** (when to stop auto-reply and notify human)

#### Out of Scope
- Free-form AI-generated replies (too risky)
- Unsolicited outreach (only replies to existing conversations)
- Cross-conversation campaigns (single conversation scope)

### Configuration Schema

```typescript
interface AutopilotConfiguration {
  globalEnabled: boolean;          // Master switch
  defaultEnabled: boolean;         // Default for new conversations (should be false)
  
  rateLimit: {
    maxMessagesPerHour: number;    // Per channel account
    maxMessagesPerDay: number;
    cooldownMinutes: number;       // Between auto-replies in same conversation
  };
  
  quietHours: {
    enabled: boolean;
    timezone: string;
    start: string;                 // "22:00"
    end: string;                   // "07:00"
    weekendsOnly: boolean;
  };
  
  eligibleSegments: string[];      // Segment IDs that can have autopilot
  
  escalation: {
    afterMessagesCount: number;    // Escalate after N auto-replies
    onKeywords: string[];          // Escalate if these words appear
    onSentiment: "negative";       // Escalate on negative sentiment (future)
  };
  
  allowedTemplateIds: string[];    // Only these templates can be auto-sent
}
```

### Guardrail Requirements

1. **No autopilot by default** - Must be explicitly enabled per conversation
2. **Template-only responses** - No free-form AI text generation
3. **Rate limiting enforced** - Cannot exceed configured limits
4. **Quiet hours respected** - No sends during quiet period
5. **Kill switch works instantly** - Global disable takes effect immediately
6. **Audit trail complete** - Every auto-sent message logged with reason
7. **Human escalation** - Auto-escalate after configured thresholds
8. **Undo window** - Short delay before send for potential cancel

### Success Criteria
- [ ] Autopilot toggle visible per conversation (off by default)
- [ ] Rate limits enforced and visible
- [ ] Quiet hours block sends during configured times
- [ ] Kill switch disables all autopilot within 1 second
- [ ] Auto-sent messages marked as "automated" in UI
- [ ] Escalation triggers notify assigned user
- [ ] Full audit log queryable by admin

### Dependencies
- Phase 6B (send capability)
- Phase 5B (brain for determining responses)

---

## Phase 7: Multi-Step Playbooks / Sequences

**Status:** Future (after Phase 6 stable)

**Goal:** Enable multi-message sequences for lead nurturing, constrained by the same safety mechanisms as Phase 6C.

### High-Level Scope

- **Playbook definition** (sequence of messages with delays)
- **Enrollment rules** (which leads enter which playbook)
- **Step conditions** (proceed if replied, wait if opened, etc.)
- **Exit conditions** (stop if converted, unsubscribed, etc.)
- **Compliance checks** (platform rules, opt-out handling)
- **A/B testing** (different message variants)

### Safety Constraints

- All playbooks require admin approval before activation
- Maximum sequence length (e.g., 5 messages)
- Minimum delay between messages (e.g., 24 hours)
- Auto-exit on negative response
- Opt-out link required for all sequences
- Per-channel compliance checks

### Dependencies
- Phase 6C (controlled autopilot stable)
- Phase 5B (brain rules for enrollment)

---

## Phase 8: Learning & Improvement Loops

**Status:** Future (after robust logging exists)

**Goal:** Use historical data to improve discovery, scoring, and messaging effectiveness.

### High-Level Scope

- **Outcome tracking** (lead → customer conversion)
- **Discovery quality scoring** (which sources produce best leads)
- **Message effectiveness** (response rates, conversion rates)
- **Rule optimization suggestions** (which rules work best)
- **Scoring model calibration** (adjust weights based on outcomes)
- **Forecasting** (predict monthly pipeline)

### Prerequisites
- Complete audit trail from Phases 5-7
- Sufficient historical data (6+ months recommended)
- Order/revenue data integration (currently missing)

### Dependencies
- Phase 7 (playbooks for sufficient messaging data)
- Orders system (not yet implemented)

---

## Cross-Phase Safety Architecture

### Guardrail Summary

| Guardrail | Phase 5 | Phase 6A | Phase 6B | Phase 6C | Phase 7 |
|-----------|---------|----------|----------|----------|---------|
| No autonomous sending | ✅ | ✅ | ✅ | Controlled | Controlled |
| Human approval required | N/A | N/A | ✅ | Opt-out | Opt-out |
| Rate limits | Discovery quota | N/A | None | ✅ | ✅ |
| Kill switch | Run cancel | N/A | N/A | ✅ | ✅ |
| Audit trail | Run history | Message log | Message log | Full audit | Full audit |
| Quiet hours | N/A | N/A | N/A | ✅ | ✅ |

### Failure Handling

| Component | Failure Type | Handling |
|-----------|--------------|----------|
| Discovery | API quota exhausted | Alert, retry next day |
| Discovery | Channel unavailable | Continue with other channels |
| Webhook | Invalid signature | Reject, log attempt |
| Webhook | Parse error | Log error, retry with backoff |
| Send | API error | Mark failed, notify user |
| Send | Rate limited | Queue for later |
| Autopilot | Escalation triggered | Notify assigned user, pause autopilot |

---

## Implementation Order Recommendation

### Option A: Discovery First (Recommended if pipeline is thin)

```
Phase 5A (2 weeks) → Phase 5B (2 weeks) → Phase 6A (3 weeks) → Phase 6B (2 weeks) → Phase 6C (2 weeks)
```

**Pros:** More leads in system before messaging capability needed
**Cons:** Longer wait for omnichannel inbox

### Option B: Inbox First (Recommended if conversations exist in Respond.io)

```
Phase 6A (3 weeks) → Phase 6B (2 weeks) → Phase 5A (2 weeks) → Phase 5B (2 weeks) → Phase 6C (2 weeks)
```

**Pros:** Unified inbox quickly, can manage existing conversations
**Cons:** No new lead generation during inbox build

### Recommended: Option B (Inbox First)

**Rationale:**
1. CCS likely has existing conversations in Respond.io that need management
2. Inbox provides immediate operational value
3. Discovery can run in background while team uses inbox
4. Phase 5B brain can inform Phase 6B suggestions

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-11 | 1.0 | Initial roadmap v2 creation |
| 2026-01-13 | 1.1 | Added assisted outreach (Yolande Formula) to Phase 5B, updated Phase 6A with Respond.io-first approach, added handoff workflows, updated success criteria |

---

## Related Documents

- [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md) - Detailed omnichannel spec
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Living system definition
- [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md) - Current phase status
- [VISION_GAP_ANALYSIS.md](./VISION_GAP_ANALYSIS.md) - Original gap analysis (updated)

# Phase 5B: Assisted Outreach MVP - "Yolande Formula"

> **Status:** Design Document (No Implementation Yet)  
> **Created:** January 13, 2026  
> **Last Updated:** January 13, 2026  
> **Related:** [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md), [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md)

---

## Document Purpose

This document defines the "Yolande Formula Outreach" capability—a safe, human-in-the-loop assisted outreach feature that generates suggested outreach messages based on templates and context, requiring explicit user approval before sending.

**Key Principle:** This is NOT full automation. All outreach messages require human review and approval before sending.

---

## Overview

### What Is "Yolande Formula Outreach"?

The Yolande Formula is a structured approach to generating personalized outreach messages that:

1. **Provides context** — Why reaching out now (event, discovery, referral)
2. **Introduces CCS Apparel** — Who we are and what we do
3. **Shows social proof** — Real client examples (Standard Bank PPBSA, Vodacom via Flooid, ISUZU via Avatar, etc.)
4. **Offers value** — Catalog/portfolio links, quote guidance, quick call options
5. **Clear CTA** — Specific next step (quote, call, send options)

### Safety First

- ✅ **Human approval required** — Every message must be reviewed and approved by a human
- ✅ **Rate limits** — Max messages per day/week to prevent spam
- ✅ **Suppression lists** — Never contact blocked domains/companies/contacts
- ✅ **Opt-out handling** — Respect opt-out requests, maintain suppression list
- ✅ **No spam** — Templates are professional, contextual, and value-focused

---

## Message Generator Inputs

### Required Inputs

| Input | Description | Example |
|-------|-------------|---------|
| **Lead/Company** | Target lead or company record | Lead ID or Company ID |
| **Intent** | Discovery intent or outreach reason | `agencies_all`, `events_exhibitions_sa`, `referral` |
| **Event Context** | Optional: Specific event/exhibition context | "Design Indaba 2026", "Gauteng Expo" |
| **Proof/Portfolio Links** | Social proof examples and catalog links | Standard Bank PPBSA case, catalog URL |
| **CTA** | Desired call-to-action | "Quote guidance", "Quick call", "Send options" |

### Optional Inputs

| Input | Description | Example |
|-------|-------------|---------|
| **Contact Role** | Target contact's role | "Marketing Manager", "CEO", "Procurement" |
| **Company Size** | Company size category | "SME", "Corporate 200+" |
| **Industry** | Company industry | "Marketing Agency", "Event Management" |
| **Previous Interaction** | Any prior contact history | "Met at event", "Referred by X" |

---

## Template Structure

### Core Template Sections

Every Yolande Formula message follows this structure:

```
1. CONTEXT (Why reaching out now)
   └── Event/exhibition context OR discovery context OR referral context

2. INTRODUCTION (Who we are)
   └── CCS Apparel brief introduction
   └── What we do (branded apparel, uniforms, promotional items)

3. SOCIAL PROOF (Proof points)
   └── Client examples (Standard Bank PPBSA, Vodacom via Flooid, ISUZU via Avatar)
   └── Relevant case studies or portfolio links

4. VALUE PROPOSITION (What we offer)
   └── Catalog/portfolio link placeholders
   └── Service offerings (embroidery, printing, uniforms, promotional items)

5. CTA (Clear next step)
   └── Quote guidance / Quick call / Send options
   └── Contact information
```

---

## Outreach Playbook Templates

### Template 1: Agencies (All Agencies)

**Target:** Marketing/branding/creative agencies

**Template:**

```
Subject: Branded Apparel for Your Client Campaigns

Hi {{contact.firstName}},

I noticed {{company.name}} specializes in {{industry}} and thought you might be interested in our branded apparel solutions for your client campaigns.

We're CCS Apparel, a South African supplier of branded merchandise, uniforms, and promotional items. We work with agencies like yours to provide branded apparel for client activations, events, and campaigns.

Some of our recent work includes:
- Standard Bank PPBSA (via agency partner)
- Vodacom campaigns (via Flooid)
- ISUZU branded merchandise (via Avatar)

We offer:
- Branded caps, shirts, and apparel
- Embroidery and printing services
- Quick turnaround for event deadlines
- Competitive pricing for agency clients

Would you like me to send you our catalog and some examples of recent agency projects? I can also provide a quick quote if you have an upcoming campaign.

Best regards,
{{user.name}}
CCS Apparel
{{user.phone}} | {{user.email}}
```

**Variables:**
- `{{contact.firstName}}` - Contact's first name
- `{{company.name}}` - Company name
- `{{industry}}` - Company industry
- `{{user.name}}` - Sending user's name
- `{{user.phone}}` - Sending user's phone
- `{{user.email}}` - Sending user's email

---

### Template 2: Schools (All Schools)

**Target:** Schools for uniforms/embroidery

**Template:**

```
Subject: School Uniforms and Embroidery Services

Hi {{contact.firstName}},

I came across {{company.name}} and thought you might be interested in our school uniform and embroidery services.

We're CCS Apparel, a South African supplier specializing in school uniforms, embroidered items, and sports kits. We work with schools across Gauteng and South Africa to provide quality uniforms and branded apparel.

Our services include:
- School uniforms (blazers, shirts, pants, skirts)
- Embroidery services (school logos, names, badges)
- Sports kits (tracksuits, jerseys, caps)
- Custom sizing and bulk orders

We've worked with schools similar to yours and can provide references upon request.

Would you like me to send you our school uniform catalog and pricing? I can also arrange a quick call to discuss your specific requirements.

Best regards,
{{user.name}}
CCS Apparel
{{user.phone}} | {{user.email}}
```

---

### Template 3: Businesses (SME CEO + Corporate Marketing)

**Target:** SME business owners and corporate marketing/procurement managers

**Template:**

```
Subject: Corporate Apparel and Branded Merchandise for {{company.name}}

Hi {{contact.firstName}},

I noticed {{company.name}} and thought you might be interested in our corporate apparel and branded merchandise solutions.

We're CCS Apparel, a South African supplier of uniforms, workwear, and promotional merchandise. We help businesses like yours with:
- Staff uniforms and workwear
- Branded promotional items (caps, shirts, bags)
- Corporate gifts and merchandise
- Embroidery and printing services

Some of our clients include:
- Standard Bank PPBSA
- Vodacom (via agency partner Flooid)
- ISUZU (via agency partner Avatar)

We offer competitive pricing, quick turnaround, and quality products. Whether you need uniforms for your team or branded merchandise for events and promotions, we can help.

Would you like me to send you our catalog and some examples? I can also provide a quick quote if you have specific requirements.

Best regards,
{{user.name}}
CCS Apparel
{{user.phone}} | {{user.email}}
```

---

### Template 4: Events/Exhibitions (Exhibitors/Sponsors)

**Target:** Companies listed as exhibitors/sponsors/partners for upcoming events

**Template:**

```
Subject: Branded Merchandise for {{eventContext}}

Hi {{contact.firstName}},

I noticed {{company.name}} is {{exhibitorRole}} for {{eventContext}} and thought you might need branded merchandise for the event.

We're CCS Apparel, a South African supplier specializing in branded caps, shirts, and promotional items for events and exhibitions. We work with event organizers, exhibitors, and sponsors to provide branded merchandise that helps with brand activation and visibility.

Our services include:
- Branded caps and shirts
- Promotional items (bags, pens, etc.)
- Quick turnaround for event deadlines
- Bulk orders for sponsors and exhibitors

Some of our recent event work includes:
- Standard Bank PPBSA events
- Corporate golf days
- Trade shows and exhibitions

Would you like me to send you our event merchandise catalog and pricing? I can also provide a quick quote if you have specific requirements for {{eventContext}}.

Best regards,
{{user.name}}
CCS Apparel
{{user.phone}} | {{user.email}}
```

**Additional Variables:**
- `{{eventContext}}` - Event name (e.g., "Design Indaba 2026")
- `{{exhibitorRole}}` - Role (e.g., "an exhibitor", "a sponsor", "a partner")

---

## Implementation Checklist

### Phase 5B Scope (Design Only - No Code)

- [x] Define message generator inputs
- [x] Define template structure (Yolande Formula)
- [x] Create 4 playbook templates (Agencies, Schools, Businesses, Events)
- [x] Define safety guardrails (approval, rate limits, suppression)
- [x] Document variable substitution system
- [ ] **Future Implementation:**
  - [ ] MessageTemplate data model
  - [ ] OutreachPlaybook service
  - [ ] Message generator API endpoint
  - [ ] UI for message review and approval
  - [ ] Rate limiting system
  - [ ] Suppression list management
  - [ ] Opt-out handling

### Data Model (Future)

```typescript
interface OutreachMessage {
  leadId: string;
  companyId?: string;
  contactId?: string;
  intent: string;
  templateId: string;
  variables: Record<string, string>;
  generatedContent: {
    subject?: string;
    body: string;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  sentAt?: Date;
  channel: 'email' | 'whatsapp' | 'linkedin_manual';
}
```

---

## Safety Guardrails

### 1. Human Approval Required

- Every generated message must be reviewed by a human
- User can edit message before approving
- User must explicitly click "Send" or "Approve and Send"
- No automatic sending without approval

### 2. Rate Limits

| Limit Type | Default | Configurable |
|------------|---------|--------------|
| Max per day (per user) | 20 | Yes |
| Max per week (per user) | 100 | Yes |
| Max per lead (lifetime) | 3 | Yes |
| Cooldown between messages (same lead) | 7 days | Yes |

### 3. Suppression Lists

- **Blocked Domains:** Never contact these email domains
- **Blocked Companies:** Never contact these companies
- **Blocked Contacts:** Never contact these specific contacts
- **Opt-Out List:** Contacts who have opted out

### 4. Opt-Out Handling

- Track opt-out requests
- Add to suppression list automatically
- Respect opt-out in all future outreach
- Provide opt-out link in all messages

### 5. No Spam

- Templates are professional and contextual
- Messages are personalized (not bulk spam)
- Value-focused (not salesy)
- Respectful of recipient's time

---

## Channel Support

### Phase 5B (Initial)

| Channel | Status | Notes |
|---------|--------|-------|
| **Email** | ✅ Planned | Primary channel for Phase 5B |
| **Respond.io/WhatsApp** | ⏳ Phase 6 | Requires Phase 6 omnichannel foundation |
| **LinkedIn DM** | ❌ Manual Only | No API access; manual copy-paste only |

### LinkedIn Messaging Policy

**Important:** LinkedIn messaging automation is NOT supported due to:
- No official API for direct messaging
- Terms of Service restrictions
- Risk of account suspension

**Workaround:** 
- Generate message in system
- User copies message
- User manually sends via LinkedIn native interface
- System tracks that message was sent (manual entry)

---

## Integration with Phase 5B Brain

The Outreach Playbook integrates with the Brain/Policy Layer:

1. **ICP Rules** — Only generate outreach for leads matching ICP
2. **Allow/Block Lists** — Check suppression lists before generating
3. **Action Planner** — Brain recommends "outreach" action for qualifying leads
4. **Template Selection** — Brain suggests appropriate template based on lead/company

---

## Example Workflow

### Step 1: Brain Recommends Outreach

```
Lead: "ABC Marketing Agency"
Score: 75 (Hot)
Brain Recommendation: "Outreach - Use Agencies template"
Reason: "Matches ICP: Marketing agency, Gauteng, 50+ employees"
```

### Step 2: User Initiates Outreach

```
User clicks "Generate Outreach" on lead detail page
System loads:
- Lead/Company data
- Intent: agencies_all
- Template: Agencies (All Agencies)
- Variables: contact.firstName, company.name, etc.
```

### Step 3: Message Generated

```
System generates message using template + variables
Message appears in review UI
User can:
- Edit message
- Change template
- Add/remove variables
- Preview (email/WhatsApp view)
```

### Step 4: User Approves and Sends

```
User clicks "Approve and Send"
System checks:
- Rate limits (not exceeded)
- Suppression lists (not blocked)
- Opt-out list (not opted out)
- Cooldown (7 days since last message)

If all checks pass:
- Message sent via email (Phase 5B)
- Status updated to "sent"
- Audit log created
- Lead status updated (e.g., "contacted")
```

---

## Future Enhancements (Post-Phase 5B)

1. **A/B Testing** — Test different templates and CTAs
2. **Scheduling** — Schedule messages for optimal send times
3. **Follow-up Sequences** — Multi-message sequences (Phase 7)
4. **Response Tracking** — Track opens, clicks, replies (Phase 6+)
5. **Personalization AI** — LLM-assisted personalization (Phase 8, with guardrails)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 1.0 | Initial design document - Yolande Formula Outreach |

---

## Related Documents

- [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) - Phase overview
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Living system definition
- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - System overview
- [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md) - Current phase status

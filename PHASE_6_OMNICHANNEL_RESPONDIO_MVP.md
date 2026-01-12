# Phase 6: Omnichannel Messaging MVP - Respond.io First

> **Status:** Design Document (No Implementation Yet)  
> **Created:** January 13, 2026  
> **Last Updated:** January 13, 2026  
> **Related:** [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md), [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md)

---

## Document Purpose

This document defines the MVP scope for Phase 6A: Omnichannel Messaging Foundation with Respond.io as the first integration target. This is a read-only foundation that ingests conversations from Respond.io and displays them in a unified inbox.

**Key Principle:** Phase 6A is read-only. No sending capability. That comes in Phase 6B.

---

## Overview

### What Is Phase 6A?

Phase 6A establishes the foundation for omnichannel conversation management:

1. **Data Models** — Conversation, Message, ChannelAccount models
2. **Respond.io Integration** — Webhook ingestion, message storage
3. **Identity Resolution** — Match messages to existing contacts/leads
4. **Unified Inbox** — Read-only view of all conversations
5. **Conversation Timeline** — Chronological message history

### Why Respond.io First?

- **Unified Platform** — Respond.io supports Email, WhatsApp, Instagram, Facebook, SMS in one API
- **Single Integration** — One connector instead of multiple direct integrations
- **Webhook Support** — Built-in webhook handling for real-time message ingestion
- **Contact Management** — Respond.io handles contact sync and identity management
- **Lower Complexity** — Faster to implement than multiple direct integrations

---

## MVP Scope

### In Scope (Phase 6A)

✅ **Data Models**
- Conversation model (unified across channels)
- Message model (with channel metadata)
- ChannelAccount model (Respond.io account connection)

✅ **Respond.io Integration**
- Webhook endpoint (`/api/webhooks/respond-io`)
- Webhook signature verification
- Message ingestion (inbound messages)
- Conversation creation/updates

✅ **Identity Resolution v1**
- Email matching (deterministic)
- Phone matching (E.164 normalized)
- Match to existing Contact/Lead records

✅ **Unified Inbox UI**
- Conversation list view
- Filter by channel, status, assigned user
- Search by contact/company/content
- Conversation detail view (message timeline)

✅ **Conversation Timeline**
- Chronological message display
- Participant info sidebar
- Related lead/contact/company links
- Channel indicators

### Out of Scope (Phase 6A)

❌ **Sending Messages** — Phase 6B
❌ **Auto-Replies** — Phase 6C
❌ **File Storage** — Only metadata in Phase 6A
❌ **Direct Channel Integrations** — Gmail, WhatsApp Cloud (future)
❌ **LinkedIn Messaging** — Not supported (API limitations)

---

## Data Model

### Conversation Model

```prisma
model Conversation {
  id                    String    @id @default(cuid())
  externalId            String?   // Respond.io conversation ID
  channelType           ChannelType
  channelAccountId      String
  status                ConversationStatus @default(open)
  
  leadId                String?
  contactId             String?
  companyId             String?
  
  participantIdentities Json      // Array of ParticipantIdentity
  subject               String?   // Email subject
  lastMessageAt         DateTime
  lastMessagePreview    String    @db.VarChar(200)
  unreadCount           Int      @default(0)
  
  assignedToId          String?
  tags                  String[]
  metadata              Json      // Channel-specific data
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  channelAccount        ChannelAccount @relation(fields: [channelAccountId], references: [id])
  lead                  Lead?          @relation(fields: [leadId], references: [id])
  contact               Contact?       @relation(fields: [contactId], references: [id])
  company               Company?       @relation(fields: [companyId], references: [id])
  assignedTo            User?          @relation(fields: [assignedToId], references: [id])
  messages              Message[]
  
  @@index([channelType])
  @@index([channelAccountId])
  @@index([status])
  @@index([leadId])
  @@index([contactId])
  @@index([companyId])
  @@index([assignedToId])
  @@index([lastMessageAt])
  @@unique([channelAccountId, externalId])
}

enum ChannelType {
  email
  whatsapp
  instagram
  facebook
  sms
  linkedin
  other
}

enum ConversationStatus {
  open
  closed
  snoozed
  archived
  spam
}
```

### Message Model

```prisma
model Message {
  id                String    @id @default(cuid())
  conversationId    String
  externalMessageId String    // Respond.io message ID
  
  direction         MessageDirection
  senderType        MessageSenderType
  senderId          String?   // FK to User if outbound
  senderIdentity    Json?     // ParticipantIdentity for external senders
  
  content           String    @db.Text
  contentType       MessageContentType
  contentHtml       String?   @db.Text
  
  status            MessageStatus @default(pending)
  errorMessage      String?   @db.Text
  
  attachments       Json      // Array of AttachmentMetadata
  replyToMessageId  String?
  
  sentAt            DateTime
  deliveredAt       DateTime?
  readAt            DateTime?
  
  channelMetadata   Json      // Platform-specific fields
  automatedBy       String?   // Automation rule ID if auto-sent
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  conversation      Conversation @relation(fields: [conversationId], references: [id])
  sender            User?        @relation(fields: [senderId], references: [id])
  replyToMessage    Message?     @relation("ReplyTo", fields: [replyToMessageId], references: [id])
  replies            Message[]   @relation("ReplyTo")
  
  @@index([conversationId])
  @@index([externalMessageId])
  @@index([direction])
  @@index([senderType])
  @@index([senderId])
  @@index([status])
  @@index([sentAt])
  @@unique([conversationId, externalMessageId])
}

enum MessageDirection {
  inbound
  outbound
}

enum MessageSenderType {
  lead
  contact
  user
  system
  bot
}

enum MessageContentType {
  text
  html
  image
  file
  audio
  video
  location
  template
  reaction
  sticker
}

enum MessageStatus {
  pending
  sent
  delivered
  read
  failed
}
```

### ChannelAccount Model

```prisma
model ChannelAccount {
  id                String    @id @default(cuid())
  provider          Provider  @default(respond_io)
  channelType       ChannelType
  name              String
  accountIdentifier String    // Email, phone, page ID
  
  credentials       Json      // Encrypted tokens/keys
  webhookSecret     String?
  
  status            AccountStatus @default(active)
  lastSyncAt        DateTime?
  syncError         String?   @db.Text
  
  configuration     Json      // Account-specific settings
  autopilotEnabled  Boolean   @default(false)
  rateLimitConfig   Json?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  conversations     Conversation[]
  
  @@index([provider])
  @@index([channelType])
  @@index([status])
  @@unique([provider, accountIdentifier])
}

enum Provider {
  respond_io
  gmail
  ms365
  whatsapp_cloud
  meta_business
}

enum AccountStatus {
  active
  inactive
  error
  disconnected
}
```

---

## Respond.io Integration

### Webhook Endpoint

**Endpoint:** `POST /api/webhooks/respond-io`

**Authentication:** Webhook signature verification (HMAC-SHA256)

**Payload Example:**

```json
{
  "event": "message.received",
  "conversation": {
    "id": "conv_123",
    "channel": "whatsapp",
    "status": "open",
    "participants": [
      {
        "id": "contact_456",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+27821234567"
      }
    ]
  },
  "message": {
    "id": "msg_789",
    "content": "Hello, I'm interested in your services",
    "type": "text",
    "direction": "inbound",
    "sent_at": "2026-01-13T10:30:00Z",
    "attachments": []
  }
}
```

### Webhook Processing Flow

```
1. Receive webhook at /api/webhooks/respond-io
2. Verify webhook signature (HMAC-SHA256)
3. Parse payload into normalized format
4. Find or create Conversation (by externalId)
5. Resolve participant identity (email/phone matching)
6. Create Message record
7. Update Conversation (lastMessageAt, unreadCount)
8. Return 200 OK
```

### Identity Resolution v1

**Matching Rules (deterministic):**

1. **Email Match (highest priority)**
   ```
   IF participant.email IS NOT NULL
   AND Contact.email = LOWER(participant.email)
   THEN match to Contact
   ```

2. **Phone Match (E.164 normalized)**
   ```
   IF participant.phone IS NOT NULL
   AND Contact.phone = normalize_e164(participant.phone)
   THEN match to Contact
   ```

3. **Lead Email Match**
   ```
   IF participant.email IS NOT NULL
   AND Lead.email = LOWER(participant.email)
   THEN match to Lead
   ```

4. **Lead Phone Match**
   ```
   IF participant.phone IS NOT NULL
   AND Lead.phone = normalize_e164(participant.phone)
   THEN match to Lead
   ```

5. **No Match**
   ```
   ELSE
   Mark as unresolved
   Create pending resolution for human review (Phase 6B)
   ```

---

## UI Components

### Unified Inbox (`/dashboard/inbox`)

**Features:**
- Conversation list (all channels)
- Filter by channel (email, WhatsApp, Instagram, Facebook)
- Filter by status (open, closed, snoozed, archived)
- Filter by assigned user
- Search by contact/company/content
- Sort by last message time (newest first)
- Unread count badge

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Inbox                    [Filter] [Search]     │
├─────────────────────────────────────────────────┤
│  📧 ABC Marketing Agency    WhatsApp  2 unread │
│  📧 XYZ School              Email     1 unread │
│  📱 Event Organizer Co      Instagram 0 unread │
│  ...                                           │
└─────────────────────────────────────────────────┘
```

### Conversation Detail (`/dashboard/inbox/[conversationId]`)

**Features:**
- Message timeline (chronological, oldest first)
- Participant info sidebar (contact/lead/company details)
- Related records (link to lead, contact, company)
- Channel indicator (WhatsApp, Email, etc.)
- Internal notes (separate from messages)
- Assignment controls (assign to user)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Conversation: ABC Marketing Agency  [Assign]   │
├──────────────────┬──────────────────────────────┤
│  Participant     │  Message Timeline            │
│  Info            │                              │
│                  │  [10:00] John: Hello...      │
│  Contact:        │  [10:05] You: Hi John...     │
│  John Doe        │  [10:10] John: Thanks...     │
│  Company:        │                              │
│  ABC Marketing   │  [Reply Composer - Phase 6B]│
│  Lead: #123      │                              │
└──────────────────┴──────────────────────────────┘
```

---

## Implementation Checklist

### Phase 6A MVP

**Data Layer:**
- [ ] Create Conversation model + migration
- [ ] Create Message model + migration
- [ ] Create ChannelAccount model + migration
- [ ] Implement ParticipantIdentity JSON schema
- [ ] Implement AttachmentMetadata JSON schema

**Connector Layer:**
- [ ] Create IChannelConnector interface
- [ ] Implement RespondIoConnector
- [ ] Implement ConnectorRegistry
- [ ] Webhook signature verification (HMAC-SHA256)

**Identity Resolution:**
- [ ] Implement phone number normalization (E.164)
- [ ] Implement deterministic email matching
- [ ] Implement deterministic phone matching
- [ ] Handle unresolved identities (create pending resolution)

**API Layer:**
- [ ] POST /api/webhooks/respond-io (receive messages)
- [ ] GET /api/conversations (list)
- [ ] GET /api/conversations/[id] (detail)
- [ ] GET /api/conversations/[id]/messages (message list)

**UI Layer:**
- [ ] Unified Inbox page (conversation list)
- [ ] Conversation detail page (message timeline)
- [ ] Participant info sidebar
- [ ] Channel indicator icons
- [ ] Filter and search UI

**Testing:**
- [ ] Webhook ingestion works
- [ ] Messages stored correctly
- [ ] Identity resolution matches known contacts
- [ ] UI displays conversations
- [ ] No sending capability (read-only enforced)

---

## Safety and Compliance

### Phase 6A Safety (Read-Only)

- ✅ **No sending capability** — System cannot send messages
- ✅ **Webhook verification** — All webhooks verified before processing
- ✅ **Idempotency** — Duplicate messages prevented (externalMessageId)
- ✅ **Error handling** — Failed webhooks logged, don't crash system

### Future Safety (Phase 6B+)

- ⏳ **Human approval** — All sends require user click (Phase 6B)
- ⏳ **Rate limits** — Max messages per hour/day (Phase 6C)
- ⏳ **Quiet hours** — No sends during specified times (Phase 6C)
- ⏳ **Kill switch** — Instant disable all autopilot (Phase 6C)
- ⏳ **Audit logging** — Full trail of automated actions (Phase 6C)

---

## Future Enhancements (Post-Phase 6A)

1. **Phase 6B: Assisted Replies** — Reply capability with templates
2. **Phase 6C: Controlled Autopilot** — Opt-in auto-replies
3. **Direct Integrations** — Gmail, WhatsApp Cloud (bypass Respond.io)
4. **File Storage** — Download and store attachments
5. **Advanced Identity Resolution** — Fuzzy matching, suggestions (Phase 6B+)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 1.0 | Initial MVP design document - Respond.io first |

---

## Related Documents

- [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md) - Detailed architecture spec
- [OMNICHANNEL_DATA_MODEL.md](./OMNICHANNEL_DATA_MODEL.md) - Canonical data model
- [ROADMAP_V2_PHASES_5_TO_8.md](./ROADMAP_V2_PHASES_5_TO_8.md) - Phase overview
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Living system definition

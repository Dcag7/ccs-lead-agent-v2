# Omnichannel Data Model - Canonical Schema

> **Status:** Design Document (No Implementation Yet)  
> **Created:** January 13, 2026  
> **Last Updated:** January 13, 2026  
> **Related:** [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md), [PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md](./PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md)

---

## Document Purpose

This document defines the canonical data model for omnichannel conversation management. It serves as the source of truth for:

1. **Database Schema** — Prisma model definitions
2. **Identity Resolution** — How participants are matched to contacts/leads
3. **Conversation Threading** — How messages are grouped into conversations
4. **Channel Abstraction** — How different channels (Email, WhatsApp, etc.) map to unified models

**Important:** This is a specification document. Implementation requires separate approval and Prisma migrations.

---

## Core Models

### 1. Conversation

A unified conversation thread across any channel. One conversation can contain messages from multiple channels (e.g., started on WhatsApp, continued on Email).

```prisma
model Conversation {
  id                    String    @id @default(cuid())
  
  // External Platform Reference
  externalId            String?   // External platform conversation ID (Respond.io, etc.)
  channelType           ChannelType
  channelAccountId      String
  
  // Status
  status                ConversationStatus @default(open)
  
  // Identity Resolution
  leadId                String?
  contactId             String?
  companyId             String?
  participantIdentities Json      // Array of ParticipantIdentity objects
  
  // Metadata
  subject               String?   // Email subject or conversation title
  lastMessageAt         DateTime
  lastMessagePreview    String    @db.VarChar(200)
  unreadCount           Int      @default(0)
  
  // Assignment
  assignedToId          String?
  tags                  String[]
  
  // Channel-Specific Data
  metadata              Json      // Platform-specific fields
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  channelAccount        ChannelAccount @relation(fields: [channelAccountId], references: [id])
  lead                  Lead?          @relation(fields: [leadId], references: [id])
  contact               Contact?       @relation(fields: [contactId], references: [id])
  company               Company?       @relation(fields: [companyId], references: [id])
  assignedTo            User?          @relation(fields: [assignedToId], references: [id])
  messages              Message[]
  
  // Indexes
  @@index([channelType])
  @@index([channelAccountId])
  @@index([status])
  @@index([leadId])
  @@index([contactId])
  @@index([companyId])
  @@index([assignedToId])
  @@index([lastMessageAt])
  
  // Constraints
  @@unique([channelAccountId, externalId])  // Prevent duplicate imports
}
```

**Key Design Decisions:**

1. **Unified Threading** — One Conversation can span multiple channels (future: merge WhatsApp + Email threads)
2. **External ID** — Store platform-specific conversation ID for deduplication
3. **Participant Identities** — JSON array allows multiple participants per conversation
4. **Status** — Track conversation lifecycle (open, closed, snoozed, archived)

---

### 2. Message

A single message within a conversation. Messages can be inbound (from lead/contact) or outbound (from team member or autopilot).

```prisma
model Message {
  id                String    @id @default(cuid())
  conversationId    String
  externalMessageId String    // External platform message ID (for dedup)
  
  // Direction and Sender
  direction         MessageDirection
  senderType        MessageSenderType
  senderId          String?   // FK to User if outbound by team member
  senderIdentity    Json?     // ParticipantIdentity for external senders
  
  // Content
  content           String    @db.Text
  contentType       MessageContentType
  contentHtml       String?   @db.Text  // HTML version for rich email
  
  // Status
  status            MessageStatus @default(pending)
  errorMessage      String?   @db.Text
  
  // Attachments
  attachments       Json      // Array of AttachmentMetadata objects
  
  // Threading
  replyToMessageId  String?
  
  // Timestamps
  sentAt            DateTime
  deliveredAt       DateTime?
  readAt            DateTime?
  
  // Automation
  channelMetadata   Json      // Platform-specific fields
  automatedBy        String?   // Automation rule ID if auto-sent (for audit)
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  conversation      Conversation @relation(fields: [conversationId], references: [id])
  sender            User?        @relation(fields: [senderId], references: [id])
  replyToMessage    Message?     @relation("ReplyTo", fields: [replyToMessageId], references: [id])
  replies            Message[]   @relation("ReplyTo")
  
  // Indexes
  @@index([conversationId])
  @@index([externalMessageId])
  @@index([direction])
  @@index([senderType])
  @@index([senderId])
  @@index([status])
  @@index([sentAt])
  
  // Constraints
  @@unique([conversationId, externalMessageId])  // Dedup within conversation
}
```

**Key Design Decisions:**

1. **External Message ID** — Prevents duplicate message ingestion from webhooks
2. **Sender Identity** — JSON field for external senders (not in our User table)
3. **Content Types** — Support text, HTML, images, files, audio, video, etc.
4. **Status Tracking** — Track delivery and read status (when available from platform)
5. **Threading** — `replyToMessageId` links replies to parent messages

---

### 3. ChannelAccount

Represents a connected messaging account/integration (e.g., Respond.io account, Gmail account).

```prisma
model ChannelAccount {
  id                String    @id @default(cuid())
  
  // Provider and Channel
  provider          Provider  @default(respond_io)
  channelType       ChannelType
  name              String    // Display name (e.g., "CCS Sales WhatsApp")
  accountIdentifier String    // Email, phone, page ID that identifies this account
  
  // Credentials (Encrypted)
  credentials       Json      // Encrypted API tokens/keys
  webhookSecret     String?   // Secret for verifying incoming webhooks
  
  // Status
  status            AccountStatus @default(active)
  lastSyncAt        DateTime?
  syncError         String?   @db.Text
  
  // Configuration
  configuration     Json      // Account-specific settings
  autopilotEnabled  Boolean   @default(false)  // Master autopilot toggle
  rateLimitConfig   Json?     // Account-specific rate limits
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  conversations     Conversation[]
  
  // Indexes
  @@index([provider])
  @@index([channelType])
  @@index([status])
  
  // Constraints
  @@unique([provider, accountIdentifier])  // One account per identifier
}
```

**Key Design Decisions:**

1. **Provider Abstraction** — Supports Respond.io, Gmail, WhatsApp Cloud, etc.
2. **Encrypted Credentials** — Store API keys/tokens encrypted at rest
3. **Status Tracking** — Monitor account health (active, error, disconnected)
4. **Autopilot Toggle** — Per-account autopilot control (Phase 6C)

---

## Supporting Types

### ParticipantIdentity (JSON)

Represents a participant in a conversation. Stored in `Conversation.participantIdentities` as JSON array.

```typescript
interface ParticipantIdentity {
  // Core identifiers (at least one required)
  email?: string;           // Normalized lowercase
  phone?: string;           // E.164 format (+27821234567)
  handle?: string;          // Platform handle (@username, page ID)
  
  // Resolution
  resolvedContactId?: string;  // FK to Contact if matched
  resolvedLeadId?: string;      // FK to Lead if matched
  resolutionMethod?: "email" | "phone" | "handle" | "manual" | "unresolved";
  resolutionConfidence?: number;  // 0-1, 1 = exact match
  
  // Display
  displayName?: string;
  avatarUrl?: string;
  
  // Channel-specific
  channelType: string;
  channelUserId?: string;   // Platform-specific user ID
  
  // Metadata
  firstSeenAt: string;      // ISO timestamp
  lastSeenAt: string;       // ISO timestamp
}
```

**Example:**

```json
[
  {
    "email": "john@example.com",
    "phone": "+27821234567",
    "displayName": "John Doe",
    "channelType": "whatsapp",
    "channelUserId": "wa_123",
    "resolvedContactId": "contact_456",
    "resolutionMethod": "email",
    "resolutionConfidence": 1.0,
    "firstSeenAt": "2026-01-13T10:00:00Z",
    "lastSeenAt": "2026-01-13T10:30:00Z"
  }
]
```

---

### AttachmentMetadata (JSON)

Stored in `Message.attachments` as JSON array.

```typescript
interface AttachmentMetadata {
  id: string;               // Generated ID
  filename: string;         // Original filename
  mimeType: string;         // MIME type (image/jpeg, application/pdf)
  sizeBytes: number;
  
  // URLs
  externalUrl?: string;     // URL from provider (may expire)
  storageUrl?: string;      // Our storage URL (if downloaded)
  thumbnailUrl?: string;    // Thumbnail for images/videos
  
  // Additional metadata
  width?: number;           // For images/videos
  height?: number;
  duration?: number;        // For audio/video (seconds)
  
  metadata?: Record<string, any>;  // Provider-specific metadata
}
```

**Example:**

```json
[
  {
    "id": "att_123",
    "filename": "catalog.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 2048576,
    "externalUrl": "https://respond.io/files/abc123",
    "storageUrl": "https://storage.example.com/files/xyz789",
    "metadata": {
      "respondIoFileId": "file_abc123"
    }
  }
]
```

---

## Identity Resolution Plan

### Version 1: Deterministic Matching (Phase 6A)

**Matching Rules (evaluated in order):**

1. **Email Match (highest priority)**
   ```
   IF identity.email IS NOT NULL
   AND Contact.email = LOWER(identity.email)
   THEN match to Contact
   CONFIDENCE: 1.0
   ```

2. **Phone Match (E.164 normalized)**
   ```
   IF identity.phone IS NOT NULL
   AND Contact.phone = normalize_e164(identity.phone)
   THEN match to Contact
   CONFIDENCE: 1.0
   ```

3. **Lead Email Match**
   ```
   IF identity.email IS NOT NULL
   AND Lead.email = LOWER(identity.email)
   THEN match to Lead
   CONFIDENCE: 1.0
   ```

4. **Lead Phone Match**
   ```
   IF identity.phone IS NOT NULL
   AND Lead.phone = normalize_e164(identity.phone)
   THEN match to Lead
   CONFIDENCE: 1.0
   ```

5. **No Match**
   ```
   ELSE
   Mark as unresolved
   Create pending resolution for human review (Phase 6B)
   ```

**Phone Normalization (E.164):**

```typescript
function normalizeE164(phone: string, defaultCountry = "ZA"): string {
  // Use libphonenumber or similar
  // Input: "082 123 4567" → Output: "+27821234567"
  // Input: "+27 82 123 4567" → Output: "+27821234567"
  // Input: "0821234567" → Output: "+27821234567" (assumes ZA)
}
```

---

### Version 2: Assisted Matching (Phase 6B+)

**Fuzzy Matching Rules (for suggestions only):**

1. **Name Similarity**
   - Levenshtein distance < 3
   - Soundex/Metaphone match

2. **Domain Match**
   - Email domain matches company domain

3. **Company Association**
   - Same company, similar name

**Human Review Queue:**

```prisma
model IdentityResolutionQueue {
  id                    String    @id @default(cuid())
  participantIdentity   Json      // The identity to resolve
  conversationId         String    FK → Conversation.id
  suggestedMatches       Json      // Array of SuggestedMatch
  status                 ResolutionStatus @default(pending)
  resolvedContactId      String?   FK → Contact.id (if resolved)
  resolvedBy             String?   FK → User.id (who resolved)
  resolvedAt             DateTime?
  createdAt              DateTime  @default(now())
}
```

---

## Conversation Threading Rules

### Email Threading

```
For email conversations:
1. Use In-Reply-To / References headers to find parent message
2. Set replyToMessageId to parent message
3. If no headers, thread by subject + participants
```

### Messaging App Threading

```
For WhatsApp/Instagram/Facebook:
1. All messages in same conversation are one thread
2. Use platform's reply feature if available
3. replyToMessageId only set if explicit reply
```

### Cross-Channel Threading (Future)

```
Future enhancement: Merge conversations across channels
IF same participant identities (email/phone match)
AND within 30 days
THEN merge into single conversation
```

---

## Channel Mapping

### Respond.io Channels

| Respond.io Channel | ChannelType | Notes |
|-------------------|-------------|-------|
| Email | `email` | Standard email |
| WhatsApp | `whatsapp` | WhatsApp Business |
| Instagram | `instagram` | Instagram Direct Messages |
| Facebook | `facebook` | Facebook Messenger |
| SMS | `sms` | SMS via Respond.io |

### Future Direct Integrations

| Provider | ChannelType | Implementation |
|----------|-------------|---------------|
| Gmail | `email` | Gmail API |
| Microsoft 365 | `email` | Microsoft Graph API |
| WhatsApp Cloud | `whatsapp` | WhatsApp Business Cloud API |
| Meta Business | `instagram`, `facebook` | Instagram/Facebook Messaging API |

---

## Data Flow

### Inbound Message Flow

```
1. Webhook received → /api/webhooks/respond-io
2. Verify webhook signature
3. Parse payload → IncomingMessageEvent
4. Find or create Conversation (by externalId)
5. Resolve participant identity (email/phone matching)
6. Create Message record
7. Update Conversation (lastMessageAt, unreadCount)
8. Return 200 OK
```

### Outbound Message Flow (Phase 6B+)

```
1. User composes message → /api/conversations/[id]/reply
2. Validate message (content, attachments)
3. Check guardrails (rate limits, quiet hours, suppression)
4. Send via connector (RespondIoConnector.sendMessage)
5. Create Message record (status: pending)
6. Update status from webhook (sent, delivered, read)
```

---

## Future-Proof Design

### Adding New Channels

To add a new channel (e.g., Telegram):

1. **Add ChannelType enum value**
   ```prisma
   enum ChannelType {
     // ... existing
     telegram
   }
   ```

2. **Implement IChannelConnector**
   ```typescript
   class TelegramConnector implements IChannelConnector {
     readonly providerId = "telegram";
     readonly supportedChannels = ["telegram"];
     // ... implement interface methods
   }
   ```

3. **Register connector**
   ```typescript
   registry.registerConnector(new TelegramConnector());
   ```

**No schema changes needed** — Conversation and Message models are channel-agnostic.

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 1.0 | Initial canonical data model specification |

---

## Related Documents

- [PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md](./PHASE_6_OMNICHANNEL_MESSAGING_DESIGN.md) - Detailed architecture
- [PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md](./PHASE_6_OMNICHANNEL_RESPONDIO_MVP.md) - MVP scope
- [CORE_LEAD_AGENT_DEFINITION.md](./CORE_LEAD_AGENT_DEFINITION.md) - Living system definition

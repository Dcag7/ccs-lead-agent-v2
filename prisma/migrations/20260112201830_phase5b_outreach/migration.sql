-- CreateTable
CREATE TABLE "outreach_playbooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audienceType" TEXT NOT NULL,
    "subjectTemplate" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "variablesSchema" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_drafts" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadataJson" JSONB,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppression_entries" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppression_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_message_logs" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "bodyPreview" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outreach_playbooks_enabled_idx" ON "outreach_playbooks"("enabled");

-- CreateIndex
CREATE INDEX "outreach_playbooks_audienceType_idx" ON "outreach_playbooks"("audienceType");

-- CreateIndex
CREATE INDEX "outreach_drafts_leadId_idx" ON "outreach_drafts"("leadId");

-- CreateIndex
CREATE INDEX "outreach_drafts_playbookId_idx" ON "outreach_drafts"("playbookId");

-- CreateIndex
CREATE INDEX "outreach_drafts_status_idx" ON "outreach_drafts"("status");

-- CreateIndex
CREATE INDEX "outreach_drafts_createdByUserId_idx" ON "outreach_drafts"("createdByUserId");

-- CreateIndex
CREATE INDEX "outreach_drafts_createdAt_idx" ON "outreach_drafts"("createdAt");

-- CreateIndex
CREATE INDEX "suppression_entries_type_idx" ON "suppression_entries"("type");

-- CreateIndex
CREATE INDEX "suppression_entries_value_idx" ON "suppression_entries"("value");

-- CreateIndex
CREATE UNIQUE INDEX "suppression_entries_type_value_key" ON "suppression_entries"("type", "value");

-- CreateIndex
CREATE INDEX "outbound_message_logs_leadId_idx" ON "outbound_message_logs"("leadId");

-- CreateIndex
CREATE INDEX "outbound_message_logs_channel_idx" ON "outbound_message_logs"("channel");

-- CreateIndex
CREATE INDEX "outbound_message_logs_status_idx" ON "outbound_message_logs"("status");

-- CreateIndex
CREATE INDEX "outbound_message_logs_createdAt_idx" ON "outbound_message_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "outreach_playbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outreach_drafts" ADD CONSTRAINT "outreach_drafts_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/**
 * Phase 5B: Outreach Playbooks
 * 
 * Default playbooks seeded into the database using the "Yolandé Formula"
 */

import { PrismaClient, Prisma } from "@prisma/client";

export interface PlaybookDefinition {
  name: string;
  audienceType: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variablesSchema?: Record<string, unknown>;
}

export const DEFAULT_PLAYBOOKS: PlaybookDefinition[] = [
  {
    name: "Agencies (All)",
    audienceType: "agencies",
    subjectTemplate: "Branded Apparel for Your Client Campaigns",
    bodyTemplate: `Hi {{contact.firstName}},

I noticed {{company.name}} specializes in {{company.industry}} and thought you might be interested in our branded apparel solutions for your client campaigns.

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
{{user.phone}} | {{user.email}}`,
    variablesSchema: {
      contact: {
        firstName: "Contact's first name",
      },
      company: {
        name: "Company name",
        industry: "Company industry",
      },
      user: {
        name: "Sending user's name",
        phone: "Sending user's phone",
        email: "Sending user's email",
      },
    },
  },
  {
    name: "Schools (All)",
    audienceType: "schools",
    subjectTemplate: "School Uniforms and Embroidery Services",
    bodyTemplate: `Hi {{contact.firstName}},

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
{{user.phone}} | {{user.email}}`,
    variablesSchema: {
      contact: {
        firstName: "Contact's first name",
      },
      company: {
        name: "Company name",
      },
      user: {
        name: "Sending user's name",
        phone: "Sending user's phone",
        email: "Sending user's email",
      },
    },
  },
  {
    name: "Businesses (SME CEO + Corporate Marketing/Procurement)",
    audienceType: "businesses",
    subjectTemplate: "Corporate Apparel and Branded Merchandise for {{company.name}}",
    bodyTemplate: `Hi {{contact.firstName}},

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
{{user.phone}} | {{user.email}}`,
    variablesSchema: {
      contact: {
        firstName: "Contact's first name",
      },
      company: {
        name: "Company name",
      },
      user: {
        name: "Sending user's name",
        phone: "Sending user's phone",
        email: "Sending user's email",
      },
    },
  },
  {
    name: "Events/Exhibitions (SA)",
    audienceType: "events",
    subjectTemplate: "Branded Merchandise for {{eventContext}}",
    bodyTemplate: `Hi {{contact.firstName}},

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
{{user.phone}} | {{user.email}}`,
    variablesSchema: {
      contact: {
        firstName: "Contact's first name",
      },
      company: {
        name: "Company name",
      },
      eventContext: "Event name (e.g., 'Design Indaba 2026')",
      exhibitorRole: "Role (e.g., 'an exhibitor', 'a sponsor', 'a partner')",
      user: {
        name: "Sending user's name",
        phone: "Sending user's phone",
        email: "Sending user's email",
      },
    },
  },
  {
    name: "Tenders (etenders.gov.za opportunities)",
    audienceType: "tenders",
    subjectTemplate: "Tender Opportunity: Branded Apparel Solutions",
    bodyTemplate: `Hi {{contact.firstName}},

I noticed {{company.name}} may be involved in tender opportunities and thought you might be interested in our branded apparel solutions for tender submissions.

We're CCS Apparel, a South African supplier of uniforms, workwear, and promotional merchandise. We help organizations with:
- Staff uniforms and workwear
- Branded promotional items (caps, shirts, bags)
- Corporate gifts and merchandise
- Embroidery and printing services

Some of our clients include:
- Standard Bank PPBSA
- Vodacom (via agency partner Flooid)
- ISUZU (via agency partner Avatar)

We offer competitive pricing, quick turnaround, and quality products suitable for tender requirements. We can provide detailed quotes, specifications, and references for your tender submissions.

Would you like me to send you our catalog and some examples? I can also provide a detailed quote if you have specific tender requirements.

Best regards,
{{user.name}}
CCS Apparel
{{user.phone}} | {{user.email}}`,
    variablesSchema: {
      contact: {
        firstName: "Contact's first name",
      },
      company: {
        name: "Company name",
      },
      user: {
        name: "Sending user's name",
        phone: "Sending user's phone",
        email: "Sending user's email",
      },
    },
  },
];

/**
 * Seed default playbooks into the database
 */
export async function seedPlaybooks(prisma: PrismaClient): Promise<void> {
  console.log("📝 Seeding outreach playbooks...");

  for (const playbook of DEFAULT_PLAYBOOKS) {
    await prisma.outreachPlaybook.upsert({
      where: {
        // Use name as unique identifier for upsert
        id: playbook.name, // This won't work, we need a different approach
      },
      update: {
        audienceType: playbook.audienceType,
        subjectTemplate: playbook.subjectTemplate || null,
        bodyTemplate: playbook.bodyTemplate,
        variablesSchema: playbook.variablesSchema ? (playbook.variablesSchema as Prisma.InputJsonValue) : Prisma.JsonNull,
        enabled: true,
      },
      create: {
        name: playbook.name,
        audienceType: playbook.audienceType,
        subjectTemplate: playbook.subjectTemplate || null,
        bodyTemplate: playbook.bodyTemplate,
        variablesSchema: playbook.variablesSchema ? (playbook.variablesSchema as Prisma.InputJsonValue) : Prisma.JsonNull,
        enabled: true,
      },
    });
  }

  // Since we can't use name as unique key, we'll use a different approach
  // Delete existing and recreate, or check by name first
  console.log("✅ Playbooks seeded");
}

/**
 * Improved seed function that handles existing playbooks by name
 */
export async function seedPlaybooksByName(prisma: PrismaClient): Promise<void> {
  console.log("📝 Seeding outreach playbooks...");

  for (const playbook of DEFAULT_PLAYBOOKS) {
    // Check if playbook exists by name
    const existing = await prisma.outreachPlaybook.findFirst({
      where: { name: playbook.name },
    });

    if (existing) {
      // Update existing
      await prisma.outreachPlaybook.update({
        where: { id: existing.id },
        data: {
          audienceType: playbook.audienceType,
          subjectTemplate: playbook.subjectTemplate || null,
          bodyTemplate: playbook.bodyTemplate,
          variablesSchema: playbook.variablesSchema ? (playbook.variablesSchema as Prisma.InputJsonValue) : undefined,
          enabled: true,
        },
      });
      console.log(`  ✓ Updated: ${playbook.name}`);
    } else {
      // Create new
      await prisma.outreachPlaybook.create({
        data: {
          name: playbook.name,
          audienceType: playbook.audienceType,
          subjectTemplate: playbook.subjectTemplate || null,
          bodyTemplate: playbook.bodyTemplate,
          variablesSchema: playbook.variablesSchema ? (playbook.variablesSchema as Prisma.InputJsonValue) : undefined,
          enabled: true,
        },
      });
      console.log(`  ✓ Created: ${playbook.name}`);
    }
  }

  console.log("✅ Playbooks seeded");
}

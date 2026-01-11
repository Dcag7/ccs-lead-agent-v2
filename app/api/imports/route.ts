import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * GET /api/imports
 * Fetch all import jobs ordered by creation date (newest first)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const imports = await prisma.importJob.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ imports });
  } catch (error) {
    console.error("Error fetching imports:", error);
    return NextResponse.json({ error: "Failed to fetch imports" }, { status: 500 });
  }
}

/**
 * POST /api/imports
 * Upload and process CSV file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
    }

    // Validate type
    if (!["company", "contact", "lead"].includes(type)) {
      return NextResponse.json({ error: "Invalid import type" }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();

    // Create import job
    const importJob = await prisma.importJob.create({
      data: {
        type,
        filename: file.name,
        status: "pending",
      },
    });

    try {
      // Update status to running
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: { status: "running" },
      });

      // Parse CSV
      const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>((
        resolve,
        reject
      ) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });

      const rows = parseResult.data as Array<Record<string, string>>;
      const rowsIn = rows.length;
      let rowsSuccess = 0;
      let rowsError = 0;
      const errors: string[] = [];

      // Process each row based on type
      if (type === "company") {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            // Validate required fields
            if (!row.name || row.name.trim() === "") {
              throw new Error("Company name is required");
            }

            // Check if company exists (case-insensitive)
            const existing = await prisma.company.findFirst({
              where: {
                name: {
                  equals: row.name.trim(),
                  mode: "insensitive",
                },
              },
            });

            const companyData = {
              name: row.name.trim(),
              website: row.website?.trim() || null,
              industry: row.industry?.trim() || null,
              country: row.country?.trim() || null,
              size: row.size?.trim() || null,
            };

            if (existing) {
              // Update existing company
              await prisma.company.update({
                where: { id: existing.id },
                data: companyData,
              });
            } else {
              // Create new company
              await prisma.company.create({
                data: companyData,
              });
            }

            rowsSuccess++;
          } catch (error: unknown) {
            rowsError++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Row ${i + 2}: ${errorMessage}`);
          }
        }
      } else if (type === "contact") {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            // Validate required fields
            if (!row.firstName || row.firstName.trim() === "") {
              throw new Error("First name is required");
            }
            if (!row.lastName || row.lastName.trim() === "") {
              throw new Error("Last name is required");
            }
            if (!row.email || row.email.trim() === "") {
              throw new Error("Email is required");
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email.trim())) {
              throw new Error("Invalid email format");
            }

            // Find or create company
            let companyId: string | null = null;
            if (row.companyName && row.companyName.trim() !== "") {
              let company = await prisma.company.findFirst({
                where: {
                  name: {
                    equals: row.companyName.trim(),
                    mode: "insensitive",
                  },
                },
              });

              if (!company) {
                // Create company with just the name
                company = await prisma.company.create({
                  data: { name: row.companyName.trim() },
                });
              }

              companyId = company.id;
            }

            // Check if contact exists (case-insensitive email)
            const existing = await prisma.contact.findFirst({
              where: {
                email: {
                  equals: row.email.trim(),
                  mode: "insensitive",
                },
              },
            });

            const contactData = {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              email: row.email.trim().toLowerCase(),
              phone: row.phone?.trim() || null,
              role: row.role?.trim() || null,
              companyId,
            };

            if (existing) {
              // Update existing contact
              await prisma.contact.update({
                where: { id: existing.id },
                data: contactData,
              });
            } else {
              // Create new contact
              await prisma.contact.create({
                data: contactData,
              });
            }

            rowsSuccess++;
          } catch (error: unknown) {
            rowsError++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Row ${i + 2}: ${errorMessage}`);
          }
        }
      } else if (type === "lead") {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            // Validate required fields
            if (!row.email || row.email.trim() === "") {
              throw new Error("Email is required");
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email.trim())) {
              throw new Error("Invalid email format");
            }

            // Validate and parse score
            let score = 0;
            if (row.score && row.score.trim() !== "") {
              const parsedScore = parseInt(row.score.trim());
              if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
                throw new Error("Score must be between 0 and 100");
              }
              score = parsedScore;
            }

            // Validate status
            const validStatuses = [
              "new",
              "contacted",
              "qualified",
              "proposal",
              "negotiation",
              "closed-won",
              "closed-lost",
            ];
            let status = "new";
            if (row.status && row.status.trim() !== "") {
              if (!validStatuses.includes(row.status.trim().toLowerCase())) {
                throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
              }
              status = row.status.trim().toLowerCase();
            }

            // Find or create company
            let companyId: string | null = null;
            if (row.companyName && row.companyName.trim() !== "") {
              let company = await prisma.company.findFirst({
                where: {
                  name: {
                    equals: row.companyName.trim(),
                    mode: "insensitive",
                  },
                },
              });

              if (!company) {
                // Create company with just the name
                company = await prisma.company.create({
                  data: { name: row.companyName.trim() },
                });
              }

              companyId = company.id;
            }

            // Find contact (don't create if not found)
            let contactId: string | null = null;
            if (row.contactEmail && row.contactEmail.trim() !== "") {
              const contact = await prisma.contact.findFirst({
                where: {
                  email: {
                    equals: row.contactEmail.trim(),
                    mode: "insensitive",
                  },
                },
              });

              if (contact) {
                contactId = contact.id;
              }
            }

            // Check if lead exists (case-insensitive email)
            const existing = await prisma.lead.findFirst({
              where: {
                email: {
                  equals: row.email.trim(),
                  mode: "insensitive",
                },
              },
            });

            const leadData = {
              email: row.email.trim().toLowerCase(),
              firstName: row.firstName?.trim() || null,
              lastName: row.lastName?.trim() || null,
              phone: row.phone?.trim() || null,
              country: row.country?.trim() || null,
              status,
              score,
              source: row.source?.trim() || null,
              companyId,
              contactId,
            };

            if (existing) {
              // Update existing lead
              await prisma.lead.update({
                where: { id: existing.id },
                data: leadData,
              });
            } else {
              // Create new lead
              await prisma.lead.create({
                data: leadData,
              });
            }

            rowsSuccess++;
          } catch (error: unknown) {
            rowsError++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Row ${i + 2}: ${errorMessage}`);
          }
        }
      }

      // Update import job with results
      const errorMessage = errors.length > 0 ? errors.slice(0, 10).join("; ") : null;
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          rowsIn,
          rowsSuccess,
          rowsError,
          status: "completed",
          finishedAt: new Date(),
          errorMessage,
        },
      });

      return NextResponse.json({
        success: true,
        importJobId: importJob.id,
        rowsIn,
        rowsSuccess,
        rowsError,
        errors: errors.slice(0, 10), // Return first 10 errors
      });
    } catch (error: unknown) {
      // Update import job as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errorMessage: errorMessage,
        },
      });

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("Error processing import:", error);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}

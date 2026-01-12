/**
 * GET /api/outreach/playbooks
 * 
 * List all enabled playbooks
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playbooks = await prisma.outreachPlaybook.findMany({
      where: { enabled: true },
      select: {
        id: true,
        name: true,
        audienceType: true,
        subjectTemplate: true,
        variablesSchema: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ playbooks });
  } catch (error) {
    console.error("Error fetching playbooks:", error);
    return NextResponse.json({ error: "Failed to fetch playbooks" }, { status: 500 });
  }
}

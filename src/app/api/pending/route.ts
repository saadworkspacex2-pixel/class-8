import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pendingChanges } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, isSuperAdmin, isAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Get all pending changes (super admin only)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rows = await db.select().from(pendingChanges).orderBy(desc(pendingChanges.createdAt));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// Secondary admin submits a pending change
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { actionType, actionLabel, endpoint, method, payload } = body;
    const created = await db.insert(pendingChanges).values({
      actionType,
      actionLabel,
      endpoint,
      method,
      payload: payload as Record<string, unknown>,
      status: "pending",
    }).returning();
    return NextResponse.json(created[0], { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

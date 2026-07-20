import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { behaviors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (studentId) {
      const rows = await db.select().from(behaviors).where(eq(behaviors.studentId, parseInt(studentId))).limit(1);
      return NextResponse.json(rows[0] || null);
    }
    return NextResponse.json(await db.select().from(behaviors));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { studentId, ...fields } = body;
    if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
    const check = await queueIfSecondary(session, "update_behavior", `Update behavior scores for student ID ${studentId}`, "/api/behaviors", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    const existing = await db.select().from(behaviors).where(eq(behaviors.studentId, studentId)).limit(1);
    if (existing.length > 0) {
      const updated = await db.update(behaviors).set({ ...fields, updatedAt: new Date() }).where(eq(behaviors.studentId, studentId)).returning();
      return NextResponse.json(updated[0]);
    } else {
      const created = await db.insert(behaviors).values({ studentId, ...fields }).returning();
      return NextResponse.json(created[0], { status: 201 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

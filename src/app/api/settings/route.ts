import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let rows = await db.select().from(settings).limit(1);
    if (rows.length === 0) {
      await db.insert(settings).values({});
      rows = await db.select().from(settings).limit(1);
    }
    return NextResponse.json(rows[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Build descriptive label
    const changes: string[] = [];
    if (body.captainRoll !== undefined) changes.push(`Captain → Roll ${body.captainRoll || "none"}`);
    if (body.monitorRoll !== undefined) changes.push(`Monitor → Roll ${body.monitorRoll || "none"}`);
    if (body.adminPassword !== undefined) changes.push("Admin password change");
    if (body.schoolName !== undefined) changes.push(`School name → "${body.schoolName}"`);
    if (body.classTeacherName !== undefined) changes.push(`Class teacher → "${body.classTeacherName}"`);
    if (body.principalName !== undefined) changes.push(`Principal → "${body.principalName}"`);
    if (body.academicYear !== undefined) changes.push(`Academic year → ${body.academicYear}`);
    if (body.nextRollNumber !== undefined) changes.push(`Next roll → ${body.nextRollNumber}`);
    if (body.examFullMarks !== undefined) changes.push("Exam full marks update");
    if (body.developerName !== undefined) changes.push(`Developer → "${body.developerName}"`);
    const label = changes.length > 0 ? `Settings: ${changes.join(", ")}` : "Update school settings";

    // Secondary admin — queue for approval
    const check = await queueIfSecondary(session, "update_settings", label, "/api/settings", "PUT", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    let rows = await db.select().from(settings).limit(1);
    if (rows.length === 0) {
      await db.insert(settings).values({});
      rows = await db.select().from(settings).limit(1);
    }

    const updated = await db
      .update(settings)
      .set(body)
      .where(eq(settings.id, rows[0].id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

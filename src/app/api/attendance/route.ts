import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, students, auditLogs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");

    let query = db.select().from(attendance);

    if (date && studentId) {
      const records = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.date, date), eq(attendance.studentId, parseInt(studentId))));
      return NextResponse.json({ records });
    }

    if (date) {
      const records = await db.select().from(attendance).where(eq(attendance.date, date));
      return NextResponse.json({ records });
    }

    if (studentId) {
      const records = await db
        .select()
        .from(attendance)
        .where(eq(attendance.studentId, parseInt(studentId)));
      return NextResponse.json({ records });
    }

    const records = await db.select().from(attendance);
    return NextResponse.json({ records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, date, status, remarks } = body;

    if (!studentId || !date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if attendance already exists for student on this date
    const existing = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.studentId, parseInt(studentId)), eq(attendance.date, date)));

    if (existing.length > 0) {
      const updated = await db
        .update(attendance)
        .set({ status, remarks: remarks || "", updatedAt: new Date() })
        .where(eq(attendance.id, existing[0].id))
        .returning();
      return NextResponse.json({ success: true, record: updated[0] });
    }

    const inserted = await db
      .insert(attendance)
      .values({
        studentId: parseInt(studentId),
        date,
        status,
        remarks: remarks || "",
      })
      .returning();

    return NextResponse.json({ success: true, record: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save attendance" }, { status: 500 });
  }
}

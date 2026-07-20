import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType");
    const subject = searchParams.get("subject");
    const studentId = searchParams.get("studentId");

    let query = db.select().from(marks);

    const conditions = [];
    if (examType) conditions.push(eq(marks.examType, examType));
    if (subject) conditions.push(eq(marks.subject, subject));
    if (studentId) conditions.push(eq(marks.studentId, parseInt(studentId)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query;
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Secondary admin — queue for approval
    const markEntries = body.entries || [];
    const exam = markEntries[0]?.examType || "?";
    const subj = markEntries[0]?.subject || "?";
    const check = await queueIfSecondary(session, "update_marks", `Save marks: ${subj} — ${exam} (${markEntries.length} students)`, "/api/marks", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });

    const { entries } = body as {
      entries: Array<{
        studentId: number;
        examType: string;
        subject: string;
        cq: number;
        mcq: number;
        total: number;
      }>;
    };

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const results = [];
    for (const entry of entries) {
      // Check if mark already exists
      const existing = await db
        .select()
        .from(marks)
        .where(
          and(
            eq(marks.studentId, entry.studentId),
            eq(marks.examType, entry.examType),
            eq(marks.subject, entry.subject)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const updated = await db
          .update(marks)
          .set({
            cq: entry.cq,
            mcq: entry.mcq,
            total: entry.total,
            updatedAt: new Date(),
          })
          .where(eq(marks.id, existing[0].id))
          .returning();
        results.push(updated[0]);
      } else {
        const inserted = await db
          .insert(marks)
          .values({
            studentId: entry.studentId,
            examType: entry.examType,
            subject: entry.subject,
            cq: entry.cq,
            mcq: entry.mcq,
            total: entry.total,
          })
          .returning();
        results.push(inserted[0]);
      }
    }

    return NextResponse.json(results);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

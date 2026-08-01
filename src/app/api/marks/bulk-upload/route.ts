import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
// Section auto-determined from roll number

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { entries, subject } = body as {
      subject: string;
      entries: UploadRow[];
    } & Record<string, unknown>;

    interface UploadRow {
      sl: number;
      idNo: string;
      studentName: string;
      roll: number | null;
      mt1Cq: number;
      mt1Mcq: number;
      mt2Cq: number;
      mt2Mcq: number;
      mtTotal: number;
      termCq: number;
      termMcq: number;
      termPract: number;
      termSba: number;
      termTotal: number;
    };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "No entries provided" }, { status: 400 });
    }

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process in a transaction-like batch
    for (const row of entries) {
      try {
        if (!row.roll || !row.studentName) {
          errors.push(`Row ${row.sl || "?"}: Missing name or roll number, skipped`);
          continue;
        }

        const rollNumber = parseInt(row.roll.toString());
        const idNo = row.idNo || `STU-${rollNumber}`;

        // Check if student exists by roll number
        let existingStudents = await db
          .select()
          .from(students)
          .where(eq(students.rollNumber, rollNumber))
          .limit(1);

        let studentId: number;

        if (existingStudents.length === 0) {
          // Auto-create student
          const newStudent = await db
            .insert(students)
            .values({
              name: row.studentName.trim(),
              rollNumber: rollNumber,
              password: "pass123",
              studentId: idNo,
            })
            .returning();
          studentId = newStudent[0].id;
          createdCount++;
        } else {
          studentId = existingStudents[0].id;
        }

        // Helper to safely parse numbers
        const toNum = (val: number | null | undefined): number => {
          if (val === null || val === undefined || val === 0) return 0;
          const n = typeof val === 'string' ? parseFloat(val) : val;
          return isNaN(n) ? 0 : Math.round(n * 100) / 100;
        };

        const mt1Cq = toNum(row.mt1Cq);
        const mt1Mcq = toNum(row.mt1Mcq);
        const mt2Cq = toNum(row.mt2Cq);
        const mt2Mcq = toNum(row.mt2Mcq);
        const termCq = toNum(row.termCq);
        const termMcq = toNum(row.termMcq);
        const termPract = toNum(row.termPract);
        const termSba = toNum(row.termSba);

        // Upsert MT1 marks
        if (mt1Cq > 0 || mt1Mcq > 0) {
          const mt1Total = mt1Cq + mt1Mcq;
          const existingMT1 = await db
            .select()
            .from(marks)
            .where(and(eq(marks.studentId, studentId), eq(marks.examType, "1st Monthly"), eq(marks.subject, subject)))
            .limit(1);

          if (existingMT1.length > 0) {
            await db.update(marks).set({ cq: mt1Cq, mcq: mt1Mcq, total: mt1Total, updatedAt: new Date() })
              .where(eq(marks.id, existingMT1[0].id));
          } else {
            await db.insert(marks).values({ studentId, examType: "1st Monthly", subject, cq: mt1Cq, mcq: mt1Mcq, total: mt1Total });
          }
        }

        // Upsert MT2 marks
        if (mt2Cq > 0 || mt2Mcq > 0) {
          const mt2Total = mt2Cq + mt2Mcq;
          const existingMT2 = await db
            .select()
            .from(marks)
            .where(and(eq(marks.studentId, studentId), eq(marks.examType, "2nd Monthly"), eq(marks.subject, subject)))
            .limit(1);

          if (existingMT2.length > 0) {
            await db.update(marks).set({ cq: mt2Cq, mcq: mt2Mcq, total: mt2Total, updatedAt: new Date() })
              .where(eq(marks.id, existingMT2[0].id));
          } else {
            await db.insert(marks).values({ studentId, examType: "2nd Monthly", subject, cq: mt2Cq, mcq: mt2Mcq, total: mt2Total });
          }
        }

        // Upsert Term marks (Half Yearly)
        if (termCq > 0 || termMcq > 0 || termPract > 0 || termSba > 0) {
          const termTotal = toNum(row.termTotal) || (termCq + termMcq + termPract + termSba);
          const existingTerm = await db
            .select()
            .from(marks)
            .where(and(eq(marks.studentId, studentId), eq(marks.examType, "Half Yearly"), eq(marks.subject, subject)))
            .limit(1);

          if (existingTerm.length > 0) {
            await db.update(marks).set({ cq: termCq, mcq: termMcq + termPract + termSba, total: termTotal, updatedAt: new Date() })
              .where(eq(marks.id, existingTerm[0].id));
          } else {
            await db.insert(marks).values({ studentId, examType: "Half Yearly", subject, cq: termCq, mcq: termMcq + termPract + termSba, total: termTotal });
          }
        }

        updatedCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Row ${row.sl || "?"} (${row.studentName || "?"}): ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} records processed, ${createdCount} new students created`,
      summary: { total: entries.length, processed: updatedCount, created: createdCount, errors: errors.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

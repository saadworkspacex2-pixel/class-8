import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ParsedMetadata {
  examName: string;
  session: string;
  classStr: string;
  section: string;
  subject: string;
}

interface ParsedRow {
  idNo: string;
  studentName: string;
  roll: number | null;
  mtTotal: number;
  termCQ: number;
  termMCQ: number;
  termPractical: number;
  termSBA: number;
  rowIndex: number;
}

interface ImportResult {
  success: boolean;
  metadata: ParsedMetadata | null;
  summary: { totalRows: number; newStudents: number; marksSaved: number; errors: number };
  errors: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rows, metadata } = body as { rows: ParsedRow[]; metadata: ParsedMetadata };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    // Subject is required — examName defaults to "Half Yearly" if not detected
    const effectiveSubject = metadata?.subject || "";
    if (!effectiveSubject) {
      return NextResponse.json({ error: "Subject is required. Select it from the dropdown." }, { status: 400 });
    }

    const rawExamName = metadata?.examName || "";
    const examType = rawExamName.toLowerCase().includes("annual")
      ? "Annual"
      : rawExamName.toLowerCase().includes("monthly")
        ? `${rawExamName.match(/\d+/)?.[0] || "1st"} Monthly`
        : "Half Yearly";

    const result: ImportResult = {
      success: true,
      metadata,
      summary: { totalRows: rows.length, newStudents: 0, marksSaved: 0, errors: 0 },
      errors: [],
    };

    for (const row of rows) {
      try {
        if (!row.studentName || !row.roll) {
          result.summary.errors++;
          result.errors.push(`Row ${row.rowIndex}: Missing name or roll, skipped`);
          continue;
        }

        // --- Auto Student Sync: Find by roll, also try to update name ---
        let studentId: number | null = null;

        // Try to find by rollNumber first
        const existingByRoll = await db
          .select()
          .from(students)
          .where(eq(students.rollNumber, row.roll))
          .limit(1);

        if (existingByRoll.length > 0) {
          studentId = existingByRoll[0].id;
          // Always update name to match Excel — Excel is authoritative
          if (existingByRoll[0].name !== row.studentName.trim()) {
            await db.update(students).set({ name: row.studentName.trim() }).where(eq(students.id, studentId));
          }
        } else {
          // Also try by studentId
          if (row.idNo) {
            const existingById = await db
              .select()
              .from(students)
              .where(eq(students.studentId, row.idNo))
              .limit(1);
            if (existingById.length > 0) {
              studentId = existingById[0].id;
              // Update name and roll to match Excel
              await db.update(students).set({
                name: row.studentName.trim(),
                rollNumber: row.roll,
              }).where(eq(students.id, studentId));
            }
          }
        }

        // Auto-create if not found
        if (!studentId) {
          const newStudent = await db
            .insert(students)
            .values({
              name: row.studentName.trim(),
              rollNumber: row.roll,
              password: "pass123",
              studentId: row.idNo || `STU-${row.roll}`,
            })
            .returning();
          studentId = newStudent[0].id;
          result.summary.newStudents++;
        }

        // --- Weighted Score Calculation ---
        const termRawTotal = row.termCQ + row.termMCQ + row.termPractical + row.termSBA;
        const weighted80 = Math.round(termRawTotal * 0.8 * 100) / 100;
        const finalMark = Math.round((weighted80 + row.mtTotal) * 100) / 100;

        // --- Upsert Marks: Always overwrite with Excel data ---
        const existingMark = await db
          .select()
          .from(marks)
          .where(
            and(
              eq(marks.studentId, studentId),
              eq(marks.examType, examType),
              eq(marks.subject, effectiveSubject)
            )
          )
          .limit(1);

        if (existingMark.length > 0) {
          await db
            .update(marks)
            .set({
              cq: row.termCQ,
              mcq: row.termMCQ + row.termPractical + row.termSBA,
              total: finalMark,
              updatedAt: new Date(),
            })
            .where(eq(marks.id, existingMark[0].id));
        } else {
          await db.insert(marks).values({
            studentId,
            examType,
            subject: effectiveSubject,
            cq: row.termCQ,
            mcq: row.termMCQ + row.termPractical + row.termSBA,
            total: finalMark,
          });
        }

        result.summary.marksSaved++;
      } catch (err: unknown) {
        result.summary.errors++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`Row ${row.rowIndex} (${row.studentName || "?"}): ${msg}`);
      }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message, details: message }, { status: 500 });
  }
}

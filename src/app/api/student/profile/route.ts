import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks, behaviors, comments, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { SUBJECTS, getSubjectMaxForExam, calculateGrade } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const studentId = session.studentId!;
    const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    if (student.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const allMarks = await db.select().from(marks).where(eq(marks.studentId, studentId));
    const behavior = await db.select().from(behaviors).where(eq(behaviors.studentId, studentId)).limit(1);
    const commentList = await db.select().from(comments).where(eq(comments.studentId, studentId));
    const settingsRows = await db.select().from(settings).limit(1);
    const customMarks = settingsRows[0]?.examFullMarks || null;

    // Build exam-wise summary to calculate overall tier
    const examTypes = [...new Set(allMarks.map((m) => m.examType))];
    let totalObtained = 0;
    let maxTotal = 0;
    for (const subj of SUBJECTS) {
      const latestExam = examTypes[examTypes.length - 1];
      if (latestExam) {
        const cfg = getSubjectMaxForExam(subj, latestExam, customMarks);
        maxTotal += cfg.totalMax;
        totalObtained += allMarks.filter((m) => m.examType === latestExam && m.subject === subj).reduce((s, x) => s + (x.total || 0), 0);
      }
    }
    // Fallback: sum all marks / count
    if (maxTotal === 0 && allMarks.length > 0) {
      totalObtained = allMarks.reduce((s, m) => s + (m.total || 0), 0);
      maxTotal = allMarks.length * 100; // approximate
    }

    const avg = maxTotal > 0 ? (totalObtained / maxTotal) * 100 : 0;

    // Tier logic
    let tier: "S" | "A" | "B" | "C" | "D" = "D";
    if (avg >= 90) tier = "S";
    else if (avg >= 75) tier = "A";
    else if (avg >= 55) tier = "B";
    else if (avg >= 35) tier = "C";

    // Combine behavior average
    const b = behavior[0];
    const behaviorAvg = b
      ? Math.round(((b.punctuality ?? 0) + (b.discipline ?? 0) + (b.participation ?? 0) + (b.homework ?? 0) + (b.teamwork ?? 0) + (b.creativity ?? 0)) / 6)
      : 0;

    return NextResponse.json({
      student: student[0],
      marks: allMarks,
      behavior: b || null,
      behaviorAvg,
      comments: commentList,
      stats: {
        totalObtained,
        maxTotal,
        average: Math.round(avg * 10) / 10,
        grade: calculateGrade(totalObtained, maxTotal),
        tier,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

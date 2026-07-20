import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks, settings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  SUBJECTS,
  calculateGrade,
  calculateRanks,
  getSubjectMaxForExam,
  isPassing,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType");

    if (!examType) {
      return NextResponse.json({ error: "examType required" }, { status: 400 });
    }

    const allStudents = await db
      .select()
      .from(students)
      .orderBy(asc(students.rollNumber));
    const allMarks = await db
      .select()
      .from(marks)
      .where(eq(marks.examType, examType));

    const settingsRows = await db.select().from(settings).limit(1);
    const customMarks = settingsRows[0]?.examFullMarks ?? null;

    // Calculate max possible total for this exam
    let maxPossibleTotal = 0;
    for (const subj of SUBJECTS) {
      const config = getSubjectMaxForExam(subj, examType, customMarks);
      maxPossibleTotal += config.totalMax;
    }

    // Build results
    const studentResults = allStudents.map((student) => {
      const studentMarks = allMarks.filter((m) => m.studentId === student.id);
      let totalObtained = 0;
      let allPassing = true;
      const subjectResults: Array<{
        subject: string;
        cq: number;
        mcq: number;
        total: number;
        maxTotal: number;
        grade: string;
        pass: boolean;
      }> = [];

      for (const subj of SUBJECTS) {
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        const mark = studentMarks.find((m) => m.subject === subj);
        const cq = mark?.cq ?? 0;
        const mcq = mark?.mcq ?? 0;
        const total = mark?.total ?? 0;
        const grade = calculateGrade(total, config.totalMax);
        const pass = isPassing(total, config.totalMax);
        if (!pass && mark) allPassing = false;
        totalObtained += total;
        subjectResults.push({
          subject: subj,
          cq,
          mcq,
          total,
          maxTotal: config.totalMax,
          grade,
          pass,
        });
      }

      const hasAnyMarks = studentMarks.length > 0;
      const average =
        maxPossibleTotal > 0 ? (totalObtained / maxPossibleTotal) * 100 : 0;
      const overallGrade = calculateGrade(totalObtained, maxPossibleTotal);

      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        profilePicture: student.profilePicture,
        totalObtained,
        maxPossibleTotal,
        average: Math.round(average * 100) / 100,
        overallGrade,
        overallPass: hasAnyMarks ? allPassing : false,
        subjects: subjectResults,
        hasMarks: hasAnyMarks,
      };
    });

    // Overall ranking
    const scores = studentResults
      .filter((s) => s.hasMarks)
      .map((s) => ({ id: s.studentId, total: s.totalObtained }));
    const overallRanks = calculateRanks(scores);

    // Subject rankings
    const subjectRanks: Record<string, Map<number, number>> = {};
    for (const subj of SUBJECTS) {
      const subjectScores = studentResults
        .filter((s) => s.hasMarks)
        .map((s) => ({
          id: s.studentId,
          total: s.subjects.find((x) => x.subject === subj)?.total ?? 0,
        }));
      subjectRanks[subj] = calculateRanks(subjectScores);
    }

    // CQ ranking (for Half Yearly / Annual)
    const cqScores = studentResults
      .filter((s) => s.hasMarks)
      .map((s) => ({
        id: s.studentId,
        total: s.subjects.reduce((sum, x) => sum + x.cq, 0),
      }));
    const cqRanks = calculateRanks(cqScores);

    // MCQ ranking
    const mcqScores = studentResults
      .filter((s) => s.hasMarks)
      .map((s) => ({
        id: s.studentId,
        total: s.subjects.reduce((sum, x) => sum + x.mcq, 0),
      }));
    const mcqRanks = calculateRanks(mcqScores);

    const enriched = studentResults.map((s) => ({
      ...s,
      rank: overallRanks.get(s.studentId) ?? null,
      cqRank: cqRanks.get(s.studentId) ?? null,
      mcqRank: mcqRanks.get(s.studentId) ?? null,
      totalCq: s.subjects.reduce((sum, x) => sum + x.cq, 0),
      totalMcq: s.subjects.reduce((sum, x) => sum + x.mcq, 0),
      subjectRanks: Object.fromEntries(
        SUBJECTS.map((subj) => [subj, subjectRanks[subj]?.get(s.studentId) ?? null])
      ),
    }));

    // Stats
    const withMarks = enriched.filter((s) => s.hasMarks);
    const totals = withMarks.map((s) => s.totalObtained);
    const stats = {
      totalStudents: allStudents.length,
      studentsWithMarks: withMarks.length,
      highest: totals.length > 0 ? Math.max(...totals) : 0,
      lowest: totals.length > 0 ? Math.min(...totals) : 0,
      average:
        totals.length > 0
          ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100
          : 0,
      passCount: withMarks.filter((s) => s.overallPass).length,
      failCount: withMarks.filter((s) => !s.overallPass).length,
      maxPossibleTotal,
      gradeDistribution: {
        "A+": withMarks.filter((s) => s.overallGrade === "A+").length,
        A: withMarks.filter((s) => s.overallGrade === "A").length,
        "A-": withMarks.filter((s) => s.overallGrade === "A-").length,
        B: withMarks.filter((s) => s.overallGrade === "B").length,
        C: withMarks.filter((s) => s.overallGrade === "C").length,
        D: withMarks.filter((s) => s.overallGrade === "D").length,
        F: withMarks.filter((s) => s.overallGrade === "F").length,
      },
      subjectAverages: SUBJECTS.map((subj) => {
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        const vals = withMarks.map(
          (s) => s.subjects.find((x) => x.subject === subj)?.total ?? 0
        );
        return {
          subject: subj,
          average:
            vals.length > 0
              ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
              : 0,
          max: config.totalMax,
        };
      }),
    };

    return NextResponse.json({ results: enriched, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

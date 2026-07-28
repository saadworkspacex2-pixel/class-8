import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks, settings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  SUBJECTS,
  calculateGrade,
  calculateRanks,
  calculateGPA,
  calculateFinalTotal,
  getScoredMarks,
  getEffectiveMaxTotal,
  getSubjectMaxForExam,
  isMonthlyExam,
  isPassing,
  getSectionFromRoll,
  DEFAULT_MONTHLY_FULL_MARKS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType") || "Half Yearly";

    const allStudents = await db
      .select()
      .from(students)
      .orderBy(asc(students.rollNumber));
    const allMarks = await db
      .select()
      .from(marks)
      .where(eq(marks.examType, examType));

    // For Half Yearly/Annual, also fetch monthly marks
    const monthly1Marks = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "1st Monthly")) : [];
    const monthly2Marks = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "2nd Monthly")) : [];

    const settingsRows = await db.select().from(settings).limit(1);
    const customMarks = settingsRows[0]?.examFullMarks ?? null;

    // Build results
    const studentResults = allStudents.map((student) => {
      const studentMarks = allMarks.filter((m) => m.studentId === student.id);
      const hasAnyMarks = studentMarks.length > 0;
      let totalObtained = 0;
      let maxPossibleForStudent = 0;
      let allPassing = true;
      const subjectResults: Array<{
        subject: string; cq: number; mcq: number; total: number; rawTotal: number;
        maxTotal: number; grade: string; pass: boolean; monthlyMark: number; hasMark: boolean;
        cqOnly: boolean; mcqOnly: boolean; bothEntered: boolean;
      }> = [];
      const grades: string[] = [];

      for (const subj of SUBJECTS) {
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        const mark = studentMarks.find((m) => m.subject === subj);
        const cq = mark?.cq ?? 0;
        const mcq = mark?.mcq ?? 0;
        const hasMark = !!mark && (mark.cq !== 0 || mark.mcq !== 0 || mark.total !== 0);

        if (!hasMark) {
          // Subject has NO marks — do NOT count toward GPA
          subjectResults.push({
            subject: subj, cq: 0, mcq: 0, total: 0, rawTotal: 0,
            maxTotal: config.totalMax, grade: "N/A", pass: false,
            monthlyMark: 0, hasMark: false, cqOnly: false, mcqOnly: false, bothEntered: false,
          });
          continue;
        }

        // Get scored marks based on what's actually entered (CQ only, MCQ only, or both)
        const scored = getScoredMarks(cq, mcq, config.cqMax, config.mcqMax, config.hasMcq);

        if (!isMonthlyExam(examType)) {
          // Half Yearly / Annual
          const monthly1 = monthly1Marks.find((m) => m.studentId === student.id && m.subject === subj);
          const monthly2 = monthly2Marks.find((m) => m.studentId === student.id && m.subject === subj);
          const m1 = monthly1?.total ?? 0;
          const m2 = monthly2?.total ?? 0;
          const monthlyMark = (m1 + m2) / 2;
          const monthlyMax = DEFAULT_MONTHLY_FULL_MARKS[subj] || 20;

          let finalTotal: number;
          let effectiveMax: number;
          let grade: string;
          let usedMonthly = false;

          if (scored.bothEntered) {
            // Both CQ+MCQ: scale to 80% + monthly average
            usedMonthly = true;
            const { finalTotal: ft } = calculateFinalTotal(
              scored.scored, scored.maxScored, monthlyMark
            );
            finalTotal = ft;
            effectiveMax = getEffectiveMaxTotal(scored.maxScored, monthlyMax);
            grade = calculateGrade(finalTotal, effectiveMax);
          } else if (scored.cqOnly) {
            // Only CQ entered — use raw CQ marks as-is (no scaling, no monthly)
            finalTotal = cq;
            effectiveMax = config.cqMax;
            grade = calculateGrade(cq, config.cqMax, cq, config.cqMax, null);
          } else if (scored.mcqOnly) {
            // Only MCQ entered — use raw MCQ marks as-is (no scaling, no monthly)
            finalTotal = mcq;
            effectiveMax = config.mcqMax;
            grade = calculateGrade(mcq, config.mcqMax);
          } else {
            // Neither entered specifically, use whatever total exists
            finalTotal = scored.scored;
            effectiveMax = scored.maxScored;
            grade = calculateGrade(finalTotal, effectiveMax);
          }

          const pass = isPassing(finalTotal, effectiveMax);
          if (!pass) allPassing = false;
          totalObtained += finalTotal;
          maxPossibleForStudent += effectiveMax;
          grades.push(grade);

          subjectResults.push({
            subject: subj, cq, mcq, total: Math.round(finalTotal * 100) / 100,
            rawTotal: scored.scored, maxTotal: Math.round(effectiveMax * 100) / 100,
            grade, pass, monthlyMark: usedMonthly ? Math.round(monthlyMark * 100) / 100 : 0,
            hasMark: true,
            cqOnly: scored.cqOnly, mcqOnly: scored.mcqOnly, bothEntered: scored.bothEntered,
          });
        } else {
          // Monthly exam: just CQ (total mark)
          const total = cq;
          let grade: string;
          if (scored.cqOnly) {
            grade = calculateGrade(cq, config.totalMax, cq, config.cqMax, null);
          } else {
            grade = calculateGrade(total, config.totalMax);
          }
          const pass = isPassing(total, config.totalMax);
          if (!pass) allPassing = false;
          totalObtained += total;
          maxPossibleForStudent += config.totalMax;
          grades.push(grade);

          subjectResults.push({
            subject: subj, cq, mcq, total, rawTotal: total,
            maxTotal: config.totalMax, grade, pass, monthlyMark: 0,
            hasMark: true,
            cqOnly: scored.cqOnly, mcqOnly: scored.mcqOnly, bothEntered: scored.bothEntered,
          });
        }
      }

      // GPA is calculated ONLY from subjects that have marks
      const gpa = grades.length > 0 ? calculateGPA(grades) : 0;
      const average = maxPossibleForStudent > 0 ? (totalObtained / maxPossibleForStudent) * 100 : 0;
      const overallGrade = grades.length > 0 ? calculateGrade(totalObtained, maxPossibleForStudent) : "N/A";
      const section = getSectionFromRoll(student.rollNumber);

      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        section,
        profilePicture: student.profilePicture,
        totalObtained: Math.round(totalObtained * 100) / 100,
        maxPossibleTotal: Math.round(maxPossibleForStudent * 100) / 100,
        average: Math.round(average * 100) / 100,
        overallGrade,
        gpa,
        overallPass: hasAnyMarks ? allPassing : false,
        subjects: subjectResults,
        gradedSubjectsCount: grades.length,
        hasMarks: hasAnyMarks,
      };
    });

    const withMarks = studentResults.filter((s) => s.hasMarks);

    // Overall ranking by GPA
    const overallRanks = calculateRanks(
      withMarks.map((s) => ({ id: s.studentId, total: s.gpa }))
    );

    // Subject rankings
    const subjectRanks: Record<string, Map<number, number>> = {};
    for (const subj of SUBJECTS) {
      const subjectScores = withMarks
        .map((s) => ({
          id: s.studentId,
          total: s.subjects.find((x) => x.subject === subj && x.hasMark)?.total ?? -1,
        }))
        .filter((s) => s.total >= 0);
      subjectRanks[subj] = calculateRanks(subjectScores);
    }

    // CQ ranking
    const cqScores = withMarks.map((s) => ({
      id: s.studentId,
      total: s.subjects.reduce((sum, x) => sum + x.cq, 0),
    }));
    const cqRanks = calculateRanks(cqScores);

    // MCQ ranking
    const mcqScores = withMarks.map((s) => ({
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
    const totals = withMarks.map((s) => s.totalObtained);
    const stats = {
      totalStudents: allStudents.length,
      studentsWithMarks: withMarks.length,
      highest: totals.length > 0 ? Math.max(...totals) : 0,
      lowest: totals.length > 0 ? Math.min(...totals) : 0,
      average: totals.length > 0
        ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100
        : 0,
      passCount: withMarks.filter((s) => s.overallPass).length,
      failCount: withMarks.filter((s) => !s.overallPass).length,
      maxPossibleTotal: withMarks.length > 0
        ? Math.max(...withMarks.map(s => s.maxPossibleTotal))
        : 0,
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
        const vals = withMarks
          .map((s) => s.subjects.find((x) => x.subject === subj && x.hasMark)?.total)
          .filter((v): v is number => v !== undefined && v !== null);
        const maxVal = withMarks.length > 0
          ? (withMarks[0].subjects.find((x) => x.subject === subj)?.maxTotal ?? 100)
          : 100;
        return {
          subject: subj,
          average: vals.length > 0
            ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
            : 0,
          max: maxVal,
        };
      }),
    };

    return NextResponse.json({ results: enriched, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

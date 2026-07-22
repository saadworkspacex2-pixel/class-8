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
  getFinalMaxTotal,
  getSubjectMaxForExam,
  isMonthlyExam,
  isPassing,
  getSectionFromRoll,
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
    // For Half Yearly/Annual, also fetch monthly marks (1st Monthly and 2nd Monthly)
    const monthly1Marks = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "1st Monthly")) : [];
    const monthly2Marks = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "2nd Monthly")) : [];
    const settingsRows = await db.select().from(settings).limit(1);
    const customMarks = settingsRows[0]?.examFullMarks ?? null;
    // Calculate max possible total for this exam
    let maxPossibleTotal = 0;
    for (const subj of SUBJECTS) {
      if (!isMonthlyExam(examType)) {
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        const monthlyMax = DEFAULT_MONTHLY_FULL_MARKS[subj] || 20;
        maxPossibleTotal += getFinalMaxTotal(config.cqMax, config.mcqMax, monthlyMax);
      } else {
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        maxPossibleTotal += config.totalMax;
      }
    }
    const DEFAULT_MONTHLY_FULL_MARKS: Record<string, number> = {
      "Bangla 1st": 20, "Bangla 2nd": 10, "English 1st": 20, "English 2nd": 10,
      Mathematics: 20, BGS: 20, Science: 20, Islam: 20, ICT: 20,
    };
    // Build results with GPA
    const studentResults = allStudents.map((student) => {
      const studentMarks = allMarks.filter((m) => m.studentId === student.id);
      let totalObtained = 0;
      let allPassing = true;
      const subjectResults: Array<{
        subject: string; cq: number; mcq: number; total: number; rawTotal: number;
        maxTotal: number; grade: string; pass: boolean; monthlyMark: number;
      }> = [];
      const grades: string[] = [];
      for (const subj of SUBJECTS) {
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        const mark = studentMarks.find((m) => m.subject === subj);
        const cq = mark?.cq ?? 0;
        const mcq = mark?.mcq ?? 0;
        if (!isMonthlyExam(examType)) {
          // Half Yearly / Annual: 80% of (CQ+MCQ) + Monthly Mark
          const monthly1 = monthly1Marks.find((m) => m.studentId === student.id && m.subject === subj);
          const monthly2 = monthly2Marks.find((m) => m.studentId === student.id && m.subject === subj);
          // Use the average of 1st and 2nd Monthly, or whichever exists
          const m1 = monthly1?.total ?? 0;
          const m2 = monthly2?.total ?? 0;
          const monthlyMark = (m1 + m2) / 2;
          const monthlyMax = DEFAULT_MONTHLY_FULL_MARKS[subj] || 20;
          const { rawTotal, finalTotal } = calculateFinalTotal(
            cq, mcq, config.cqMax, config.mcqMax, monthlyMark
          );
          const finalMaxTotal = getFinalMaxTotal(config.cqMax, config.mcqMax, monthlyMax);
          const grade = calculateGrade(finalTotal, finalMaxTotal);
          const pass = isPassing(finalTotal, finalMaxTotal);
          if (!pass && mark) allPassing = false;
          totalObtained += finalTotal;
          grades.push(grade);
          subjectResults.push({
            subject: subj, cq, mcq, total: Math.round(finalTotal * 100) / 100,
            rawTotal, maxTotal: Math.round(finalMaxTotal * 100) / 100,
            grade, pass, monthlyMark: Math.round(monthlyMark * 100) / 100,
          });
        } else {
          // Monthly exam: just CQ (no MCQ)
          const total = cq;
          const grade = calculateGrade(total, config.totalMax);
          const pass = isPassing(total, config.totalMax);
          if (!pass && mark) allPassing = false;
          totalObtained += total;
          grades.push(grade);
          subjectResults.push({
            subject: subj, cq, mcq, total, rawTotal: total,
            maxTotal: config.totalMax, grade, pass, monthlyMark: 0,
          });
        }
      }
      const hasAnyMarks = studentMarks.length > 0;
      const average = maxPossibleTotal > 0 ? (totalObtained / maxPossibleTotal) * 100 : 0;
      const overallGrade = calculateGrade(totalObtained, maxPossibleTotal);
      const gpa = hasAnyMarks ? calculateGPA(grades) : 0;
      const section = getSectionFromRoll(student.rollNumber);
      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        section,
        profilePicture: student.profilePicture,
        totalObtained: Math.round(totalObtained * 100) / 100,
        maxPossibleTotal: Math.round(maxPossibleTotal * 100) / 100,
        average: Math.round(average * 100) / 100,
        overallGrade,
        gpa,
        overallPass: hasAnyMarks ? allPassing : false,
        subjects: subjectResults,
        hasMarks: hasAnyMarks,
      };
    });
    const withMarks = studentResults.filter((s) => s.hasMarks);
    // Overall ranking by GPA then total
    const scores = withMarks.map((s) => ({ id: s.studentId, total: s.gpa }));
    const overallRanks = calculateRanks(scores);
    // Subject rankings
    const subjectRanks: Record<string, Map<number, number>> = {};
    for (const subj of SUBJECTS) {
      const subjectScores = withMarks.map((s) => ({
        id: s.studentId,
        total: s.subjects.find((x) => x.subject === subj)?.total ?? 0,
      }));
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
      average: totals.length > 0 ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100 : 0,
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
        const vals = withMarks.map((s) => s.subjects.find((x) => x.subject === subj)?.total ?? 0);
        const maxVal = withMarks.length > 0 ? (withMarks[0].subjects.find((x) => x.subject === subj)?.maxTotal ?? 100) : 100;
        return {
          subject: subj,
          average: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0,
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

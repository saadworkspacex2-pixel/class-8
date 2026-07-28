import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks, settings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  SUBJECTS,
  COMBINED_SUBJECTS,
  COMBINED_SUBJECT_MAP,
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

    const allStudents = await db.select().from(students).orderBy(asc(students.rollNumber));
    const allMarks = await db.select().from(marks).where(eq(marks.examType, examType));

    const monthly1Marks = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "1st Monthly")) : [];
    const monthly2Marks = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "2nd Monthly")) : [];

    const settingsRows = await db.select().from(settings).limit(1);
    const customMarks = settingsRows[0]?.examFullMarks ?? null;

    const monthlyMaxima: Record<string, number> = {
      "Bangla 1st": 20, "Bangla 2nd": 10, "English 1st": 20, "English 2nd": 10,
      Mathematics: 20, BGS: 20, Science: 20, Islam: 20, ICT: 10,
    };

    // Helper: calculate marks for one individual paper
    const calcPaperTotal = (subj: string, studentId: number, cq: number, mcq: number, markExists: boolean) => {
      const config = getSubjectMaxForExam(subj, examType, customMarks);
      if (!markExists) return { total: 0, maxTotal: config.totalMax, grade: "N/A", pass: false, hasMark: false, cq, mcq, monthlyMax: 0, monthlyMark: 0 };

      if (!isMonthlyExam(examType)) {
        const monthly1 = monthly1Marks.find((m) => m.studentId === studentId && m.subject === subj);
        const monthly2 = monthly2Marks.find((m) => m.studentId === studentId && m.subject === subj);
        const m1 = monthly1?.total ?? 0;
        const m2 = monthly2?.total ?? 0;
        const monthlyMark = (m1 + m2) / 2;
        const monthlyMax = monthlyMaxima[subj] || 20;
        const { rawTotal, finalTotal } = calculateFinalTotal(cq, mcq, config.cqMax, config.mcqMax, monthlyMark);
        const finalMaxTotal = getFinalMaxTotal(config.cqMax, config.mcqMax, monthlyMax);
        const grade = calculateGrade(finalTotal, finalMaxTotal);
        const pass = isPassing(finalTotal, finalMaxTotal);
        return { total: Math.round(finalTotal * 100) / 100, maxTotal: Math.round(finalMaxTotal * 100) / 100, grade, pass, hasMark: true, cq, mcq, monthlyMax, monthlyMark: Math.round(monthlyMark * 100) / 100 };
      } else {
        const total = cq;
        const grade = calculateGrade(total, config.totalMax);
        const pass = isPassing(total, config.totalMax);
        return { total, maxTotal: config.totalMax, grade, pass, hasMark: true, cq, mcq, monthlyMax: 0, monthlyMark: 0 };
      }
    };

    // Build results with combined subjects for GPA
    const studentResults = allStudents.map((student) => {
      const studentMarks = allMarks.filter((m) => m.studentId === student.id);
      const hasAnyMarks = studentMarks.length > 0;

      // Step 1: Calculate per-paper results
      const paperResults: Record<string, { total: number; maxTotal: number; grade: string; pass: boolean; hasMark: boolean; cq: number; mcq: number }> = {};
      for (const subj of SUBJECTS) {
        const mark = studentMarks.find((m) => m.subject === subj);
        const cq = mark?.cq ?? 0;
        const mcq = mark?.mcq ?? 0;
        const hasMark = !!mark && (mark.cq !== 0 || mark.mcq !== 0 || mark.total !== 0);
        paperResults[subj] = calcPaperTotal(subj, student.id, cq, mcq, hasMark);
      }

      // Step 2: Combine into GPA subjects (Bangla = Bangla 1st + Bangla 2nd, etc.)
      let totalObtained = 0;
      let maxPossibleForStudent = 0;
      let allPassing = true;
      const combinedResults: Array<{ name: string; total: number; maxTotal: number; grade: string; pass: boolean; hasMark: boolean; papers: string[] }> = [];
      const grades: string[] = [];

      for (const combined of COMBINED_SUBJECTS) {
        const papers = COMBINED_SUBJECT_MAP[combined];
        let combinedTotal = 0, combinedMax = 0, anyHasMark = false, allPass = true;

        for (const paper of papers) {
          const pr = paperResults[paper];
          if (pr?.hasMark) {
            anyHasMark = true;
            combinedTotal += pr.total;
            combinedMax += pr.maxTotal;
            if (!pr.pass) allPass = false;
          }
        }

        if (!anyHasMark) {
          combinedResults.push({ name: combined, total: 0, maxTotal: combinedMax || 150, grade: "N/A", pass: false, hasMark: false, papers });
          continue;
        }

        const grade = calculateGrade(combinedTotal, combinedMax);
        if (!allPass) allPassing = false;
        totalObtained += combinedTotal;
        maxPossibleForStudent += combinedMax;
        grades.push(grade);
        combinedResults.push({ name: combined, total: Math.round(combinedTotal * 100) / 100, maxTotal: Math.round(combinedMax * 100) / 100, grade, pass: allPass, hasMark: true, papers });
      }

      // Step 3: Per-paper subjects for display
      const subjectResults = SUBJECTS.map((subj) => {
        const pr = paperResults[subj] || { total: 0, maxTotal: 0, grade: "N/A", pass: false, hasMark: false, cq: 0, mcq: 0 };
        const config = getSubjectMaxForExam(subj, examType, customMarks);
        return { subject: subj, cq: pr.cq, mcq: pr.mcq, total: pr.total, maxTotal: pr.maxTotal || config.totalMax, grade: pr.grade, pass: pr.pass, hasMark: pr.hasMark };
      });

      const gpa = grades.length > 0 ? calculateGPA(grades) : 0;
      const average = maxPossibleForStudent > 0 ? (totalObtained / maxPossibleForStudent) * 100 : 0;
      const overallGrade = grades.length > 0 ? calculateGrade(totalObtained, maxPossibleForStudent) : "N/A";
      const section = getSectionFromRoll(student.rollNumber);

      return {
        studentId: student.id, name: student.name, rollNumber: student.rollNumber, section,
        profilePicture: student.profilePicture,
        totalObtained: Math.round(totalObtained * 100) / 100,
        maxPossibleTotal: Math.round(maxPossibleForStudent * 100) / 100,
        average: Math.round(average * 100) / 100, overallGrade, gpa,
        overallPass: hasAnyMarks ? allPassing : false,
        combinedSubjects: combinedResults, subjects: subjectResults,
        gradedSubjectsCount: grades.length, totalSubjects: COMBINED_SUBJECTS.length,
        hasMarks: hasAnyMarks,
      };
    });

    const withMarks = studentResults.filter((s) => s.hasMarks);

    // Ranking by GPA
    const overallRanks = calculateRanks(withMarks.map((s) => ({ id: s.studentId, total: s.gpa })));

    // Subject rankings for individual papers
    const subjectRanks: Record<string, Map<number, number>> = {};
    for (const subj of SUBJECTS) {
      const scores = withMarks.map((s) => ({ id: s.studentId, total: s.subjects.find((x) => x.subject === subj && x.hasMark)?.total ?? -1 })).filter((s) => s.total >= 0);
      subjectRanks[subj] = calculateRanks(scores);
    }

    // CQ & MCQ rankings
    const cqRanks = calculateRanks(withMarks.map((s) => ({ id: s.studentId, total: s.subjects.reduce((sum, x) => sum + x.cq, 0) })));
    const mcqRanks = calculateRanks(withMarks.map((s) => ({ id: s.studentId, total: s.subjects.reduce((sum, x) => sum + x.mcq, 0) })));

    const enriched = studentResults.map((s) => ({
      ...s,
      rank: overallRanks.get(s.studentId) ?? null,
      cqRank: cqRanks.get(s.studentId) ?? null,
      mcqRank: mcqRanks.get(s.studentId) ?? null,
      totalCq: s.subjects.reduce((sum, x) => sum + x.cq, 0),
      totalMcq: s.subjects.reduce((sum, x) => sum + x.mcq, 0),
      subjectRanks: Object.fromEntries(SUBJECTS.map((subj) => [subj, subjectRanks[subj]?.get(s.studentId) ?? null])),
    }));

    const totals = withMarks.map((s) => s.totalObtained);
    const stats = {
      totalStudents: allStudents.length, studentsWithMarks: withMarks.length,
      highest: totals.length > 0 ? Math.max(...totals) : 0,
      lowest: totals.length > 0 ? Math.min(...totals) : 0,
      average: totals.length > 0 ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100 : 0,
      passCount: withMarks.filter((s) => s.overallPass).length,
      failCount: withMarks.filter((s) => !s.overallPass).length,
      maxPossibleTotal: totals.length > 0 ? Math.max(...withMarks.map(s => s.maxPossibleTotal)) : 0,
      gradeDistribution: { "A+": withMarks.filter(s => s.overallGrade === "A+").length, A: withMarks.filter(s => s.overallGrade === "A").length, "A-": withMarks.filter(s => s.overallGrade === "A-").length, B: withMarks.filter(s => s.overallGrade === "B").length, C: withMarks.filter(s => s.overallGrade === "C").length, D: withMarks.filter(s => s.overallGrade === "D").length, F: withMarks.filter(s => s.overallGrade === "F").length },
      subjectAverages: COMBINED_SUBJECTS.map((subj) => {
        const vals = withMarks.map((s) => s.combinedSubjects?.find((x: { name: string; hasMark: boolean; total: number }) => x.name === subj && x.hasMark)?.total).filter((v): v is number => v !== undefined && v !== null);
        const maxVal = withMarks.length > 0 ? (withMarks[0].combinedSubjects?.find((x: { name: string }) => x.name === subj)?.maxTotal ?? 150) : 150;
        return { subject: subj, average: vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0, max: maxVal };
      }),
    };

    return NextResponse.json({ results: enriched, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks, settings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  SUBJECTS, GPA_SUBJECTS, GPA_SUBJECT_MAP,
  gradeAndGP, calculateRanks, calculateGPA,
  calculatePaperMark, getPaperMax,
  getSubjectMaxForExam, isMonthlyExam,
  getSectionFromRoll,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examType = searchParams.get("examType") || "Half Yearly";

    const allStudents = await db.select().from(students).orderBy(asc(students.rollNumber));
    const allMarks = await db.select().from(marks).where(eq(marks.examType, examType));
    const monthly1 = !isMonthlyExam(examType) ? await db.select().from(marks).where(eq(marks.examType, "1st Monthly")) : [];
    const settingsRows = await db.select().from(settings).limit(1);
    const customMarks = settingsRows[0]?.examFullMarks ?? null;

    const monthlyMax: Record<string, number> = {
      "Bangla 1st": 20, "Bangla 2nd": 10, "English 1st": 20, "English 2nd": 10,
      Mathematics: 20, BGS: 20, Science: 20, Islam: 20, ICT: 10,
    };

    // Helper: calculate single paper total
    const calcPaper = (subj: string, sid: number, cq: number, mcq: number, has: boolean) => {
      const cfg = getSubjectMaxForExam(subj, examType, customMarks);
      if (!has) return { total: 0, maxTotal: 0, grade: "N/A", pass: false, hasMark: false, cq, mcq };

      if (isMonthlyExam(examType)) {
        const grade = gradeAndGP(cq, cfg.totalMax);
        return { total: cq, maxTotal: cfg.totalMax, grade: grade.grade, pass: grade.grade !== "F", hasMark: true, cq, mcq };
      }

      const m1 = monthly1.find((m: any) => m.studentId === sid && m.subject === subj)?.total ?? 0;
      const monthlyMark = m1;
      const mmolMax = monthlyMax[subj] || 20;
      const { finalMark } = calculatePaperMark(cq, mcq, cfg.cqMax, cfg.mcqMax, monthlyMark);
      const paperMax = getPaperMax(cfg.cqMax, cfg.mcqMax, mmolMax);
      const grade = gradeAndGP(finalMark, paperMax);
      return { total: Math.round(finalMark * 100) / 100, maxTotal: Math.round(paperMax * 100) / 100, grade: grade.grade, pass: grade.grade !== "F", hasMark: true, cq, mcq };
    };

    // Build results
    const studentResults = allStudents.map((student) => {
      const studentMarks = allMarks.filter((m: any) => m.studentId === student.id);
      const hasAnyMarks = studentMarks.length > 0;

      // Step 1: Calculate per-paper
      const papers: Record<string, { total: number; maxTotal: number; grade: string; pass: boolean; hasMark: boolean; cq: number; mcq: number }> = {};
      for (const subj of SUBJECTS) {
        const m = studentMarks.find((x: any) => x.subject === subj);
        const cq = m?.cq ?? 0; const mcq = m?.mcq ?? 0;
        const has = !!(m && (m.cq !== 0 || m.mcq !== 0 || m.total !== 0));
        papers[subj] = calcPaper(subj, student.id, cq, mcq, has);
      }

      // Step 2: Combine into 7 GPA subjects
      const gpaInputs: { mark: number; maxMark: number }[] = [];
      const gpaRows: { name: string; total: number; maxTotal: number; grade: string; gp: number; pass: boolean; hasMark: boolean; papers: string[] }[] = [];

      for (const gpaSubj of GPA_SUBJECTS) {
        const info = GPA_SUBJECT_MAP[gpaSubj];
        let total = 0, maxTotal = 0, anyHas = false, allPass = true;
        for (const p of info.papers) {
          const pr = papers[p];
          if (pr?.hasMark) { anyHas = true; total += pr.total; maxTotal += pr.maxTotal; if (!pr.pass) allPass = false; }
        }
        if (!anyHas) {
          gpaRows.push({ name: gpaSubj, total: 0, maxTotal: info.maxTotal, grade: "N/A", gp: 0, pass: false, hasMark: false, papers: info.papers });
        } else {
          const grade = gradeAndGP(total, maxTotal);
          const pass = total >= info.passMark;
          gpaInputs.push({ mark: total, maxMark: maxTotal });
          gpaRows.push({ name: gpaSubj, total: Math.round(total * 100) / 100, maxTotal, grade: grade.grade, gp: grade.gp, pass: pass, hasMark: true, papers: info.papers });
        }
      }

      // Step 3: Per-paper display
      const subjectResults = SUBJECTS.map((subj) => {
        const pr = papers[subj] || { total: 0, maxTotal: 0, grade: "N/A", pass: false, hasMark: false, cq: 0, mcq: 0 };
        const cfg = getSubjectMaxForExam(subj, examType, customMarks);
        return { subject: subj, cq: pr.cq, mcq: pr.mcq, total: pr.total, maxTotal: pr.maxTotal || cfg.totalMax, grade: pr.grade, pass: pr.pass, hasMark: pr.hasMark };
      });

      // Step 4: GPA, total, grade
      const gpa = gpaInputs.length > 0 ? calculateGPA(gpaInputs) : 0;
      const totalObtained = gpaRows.filter(r => r.hasMark).reduce((s, r) => s + r.total, 0);
      const maxPossible = gpaRows.filter(r => r.hasMark).reduce((s, r) => s + r.maxTotal, 0);
      const overall = gradeAndGP(totalObtained, maxPossible);
      const section = getSectionFromRoll(student.rollNumber);

      return {
        studentId: student.id, name: student.name, rollNumber: student.rollNumber, section,
        profilePicture: student.profilePicture,
        totalObtained: Math.round(totalObtained * 100) / 100,
        maxPossibleTotal: Math.round(maxPossible * 100) / 100,
        average: maxPossible > 0 ? Math.round((totalObtained / maxPossible) * 10000) / 100 : 0,
        overallGrade: overall.grade, gpa,
        overallPass: gpa > 0,
        gpaSubjects: gpaRows, subjects: subjectResults,
        gradedSubjectsCount: gpaInputs.length, totalSubjects: GPA_SUBJECTS.length,
        hasMarks: hasAnyMarks,
      };
    });

    const withMarks = studentResults.filter((s: any) => s.hasMarks);

    // Ranking by GPA
    const overallRanks = calculateRanks(withMarks.map((s: any) => ({ id: s.studentId, total: s.gpa, tieBreak: s.totalObtained })));

    // Per-paper subject ranks
    const subjRanks: Record<string, Map<number, number>> = {};
    for (const subj of SUBJECTS) {
      const scores = withMarks.map((s: any) => ({ id: s.studentId, total: s.subjects.find((x: any) => x.subject === subj && x.hasMark)?.total ?? -1 })).filter((s: any) => s.total >= 0);
      subjRanks[subj] = calculateRanks(scores);
    }

    const cqRanks = calculateRanks(withMarks.map((s: any) => ({ id: s.studentId, total: s.subjects.reduce((sum: number, x: any) => sum + x.cq, 0) })));
    const mcqRanks = calculateRanks(withMarks.map((s: any) => ({ id: s.studentId, total: s.subjects.reduce((sum: number, x: any) => sum + x.mcq, 0) })));

    const enriched = studentResults.map((s: any) => ({
      ...s,
      rank: overallRanks.get(s.studentId) ?? null,
      cqRank: cqRanks.get(s.studentId) ?? null,
      mcqRank: mcqRanks.get(s.studentId) ?? null,
      totalCq: s.subjects.reduce((sum: number, x: any) => sum + x.cq, 0),
      totalMcq: s.subjects.reduce((sum: number, x: any) => sum + x.mcq, 0),
      subjectRanks: Object.fromEntries(SUBJECTS.map((subj: string) => [subj, subjRanks[subj]?.get(s.studentId) ?? null])),
    }));

    const totals = withMarks.map((s: any) => s.totalObtained);
    const stats = {
      totalStudents: allStudents.length, studentsWithMarks: withMarks.length,
      highest: totals.length > 0 ? Math.max(...totals) : 0,
      lowest: totals.length > 0 ? Math.min(...totals) : 0,
      average: totals.length > 0 ? Math.round((totals.reduce((a: number, b: number) => a + b, 0) / totals.length) * 100) / 100 : 0,
      passCount: withMarks.filter((s: any) => s.overallPass).length,
      failCount: withMarks.filter((s: any) => !s.overallPass).length,
      maxPossibleTotal: withMarks.length > 0 ? Math.max(...withMarks.map((s: any) => s.maxPossibleTotal)) : 0,
      gradeDistribution: { "A+": withMarks.filter((s: any) => s.overallGrade === "A+").length, A: withMarks.filter((s: any) => s.overallGrade === "A").length, "A-": withMarks.filter((s: any) => s.overallGrade === "A-").length, B: withMarks.filter((s: any) => s.overallGrade === "B").length, C: withMarks.filter((s: any) => s.overallGrade === "C").length, D: withMarks.filter((s: any) => s.overallGrade === "D").length, F: withMarks.filter((s: any) => s.overallGrade === "F").length },
      subjectAverages: GPA_SUBJECTS.map((subj: string) => {
        const vals = withMarks.map((s: any) => s.gpaSubjects?.find((x: any) => x.name === subj && x.hasMark)?.total).filter((v: any) => v !== undefined && v !== null);
        const maxVal = withMarks.length > 0 ? (withMarks[0].gpaSubjects?.find((x: any) => x.name === subj)?.maxTotal ?? 150) : 150;
        return { subject: subj, average: vals.length > 0 ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 100) / 100 : 0, max: maxVal };
      }),
    };

    return NextResponse.json({ results: enriched, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

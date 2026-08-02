export const CLASS_NAME = "Class 8";
export const SECTION_NAME = "Dahlia (B)";
export const SECTIONS = ["shapla", "dahlia"] as const;
export type Section = (typeof SECTIONS)[number];
export function getSectionFromRoll(roll: number): Section {
  return roll % 2 === 1 ? "shapla" : "dahlia";
}
export function getAvailableRolls(section: Section): number[] {
  return section === "shapla"
    ? Array.from({ length: 110 }, (_, i) => i * 2 + 1)
    : Array.from({ length: 111 }, (_, i) => (i + 1) * 2);
}

// ─── INDIVIDUAL PAPERS (mark entry) ───
export const SUBJECTS = [
  "Bangla 1st", "Bangla 2nd",
  "English 1st", "English 2nd",
  "Mathematics", "BGS", "Science", "Islam", "ICT",
] as const;
export type SubjectName = (typeof SUBJECTS)[number];

export interface SubjectConfig { name: SubjectName; cqMax: number; mcqMax: number; totalMax: number; hasMcq: boolean; }
export const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  "Bangla 1st": { name: "Bangla 1st", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  "Bangla 2nd": { name: "Bangla 2nd", cqMax: 35, mcqMax: 15, totalMax: 50, hasMcq: true },
  "English 1st": { name: "English 1st", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  "English 2nd": { name: "English 2nd", cqMax: 50, mcqMax: 0, totalMax: 50, hasMcq: false },
  Mathematics: { name: "Mathematics", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  BGS: { name: "BGS", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  Science: { name: "Science", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  Islam: { name: "Islam", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  ICT: { name: "ICT", cqMax: 50, mcqMax: 0, totalMax: 50, hasMcq: false },
};

// ─── GPA SUBJECTS (merged for grade point) ───
export const GPA_SUBJECTS = ["Bangla", "English", "Mathematics", "BGS", "Science", "Islam", "ICT"] as const;
export type GpaSubjectName = (typeof GPA_SUBJECTS)[number];

export const GPA_SUBJECT_MAP: Record<string, { papers: string[]; maxTotal: number; passMark: number }> = {
  Bangla: { papers: ["Bangla 1st", "Bangla 2nd"], maxTotal: 150, passMark: 49.5 },
  English: { papers: ["English 1st", "English 2nd"], maxTotal: 150, passMark: 49.5 },
  Mathematics: { papers: ["Mathematics"], maxTotal: 100, passMark: 33 },
  BGS: { papers: ["BGS"], maxTotal: 100, passMark: 33 },
  Science: { papers: ["Science"], maxTotal: 100, passMark: 33 },
  Islam: { papers: ["Islam"], maxTotal: 100, passMark: 33 },
  ICT: { papers: ["ICT"], maxTotal: 50, passMark: 17 },
};

export const EXAM_TYPES = ["1st Monthly", "2nd Monthly", "Half Yearly", "Annual"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];
export const MONTHLY_EXAMS = ["1st Monthly", "2nd Monthly"] as const;

export const DEFAULT_MONTHLY_FULL_MARKS: Record<string, number> = {
  "Bangla 1st": 20, "Bangla 2nd": 10, "English 1st": 20, "English 2nd": 10,
  Mathematics: 20, BGS: 20, Science: 20, Islam: 20, ICT: 10,
};

export function isMonthlyExam(exam: string): boolean { return exam === "1st Monthly" || exam === "2nd Monthly"; }
export function getSubjectMaxForExam(subject: string, exam: string, customMarks?: Record<string, Record<string, number>> | null): SubjectConfig {
  if (isMonthlyExam(exam)) {
    const total = customMarks?.[exam]?.[subject] ?? DEFAULT_MONTHLY_FULL_MARKS[subject] ?? 20;
    return { name: subject as SubjectName, cqMax: total, mcqMax: 0, totalMax: total, hasMcq: false };
  }
  const config = SUBJECT_CONFIGS[subject];
  if (!config) return { name: subject as SubjectName, cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true };
  const customTotal = customMarks?.[exam]?.[subject];
  if (customTotal !== undefined) {
    if (!config.hasMcq) return { ...config, cqMax: customTotal, totalMax: customTotal };
    const ratio = config.cqMax / (config.cqMax + config.mcqMax);
    const cq = Math.round(customTotal * ratio);
    return { ...config, cqMax: cq, mcqMax: customTotal - cq, totalMax: customTotal };
  }
  return { ...config };
}

// ─── GRADING ───
export function gradeAndGP(mark: number, maxMark: number): { grade: string; gp: number } {
  if (maxMark <= 0) return { grade: "N/A", gp: 0 };
  const pct = (mark / maxMark) * 100;
  if (pct >= 80) return { grade: "A+", gp: 5.00 };
  if (pct >= 70) return { grade: "A", gp: 4.00 };
  if (pct >= 60) return { grade: "A-", gp: 3.50 };
  if (pct >= 50) return { grade: "B", gp: 3.00 };
  if (pct >= 40) return { grade: "C", gp: 2.00 };
  if (pct >= 33) return { grade: "D", gp: 1.00 };
  return { grade: "F", gp: 0.00 };
}

export function calculateGrade(obtained: number, total: number): string { return gradeAndGP(obtained, total).grade; }
export function isPassing(mark: number, passMark: number): boolean { return mark >= passMark; }

// ─── 80/20 WEIGHTED FORMULA ───
export function calculatePaperMark(cq: number, mcq: number, cqMax: number, mcqMax: number, monthlyMark: number): { examTotal: number; weighted80: number; finalMark: number } {
  const examTotal = cq + mcq;
  const weighted80 = Math.round(examTotal * 0.8 * 100) / 100;
  const finalMark = Math.round((weighted80 + monthlyMark) * 100) / 100;
  return { examTotal, weighted80, finalMark };
}

export function getPaperMax(cqMax: number, mcqMax: number, monthlyMax: number): number {
  return Math.round(((cqMax + mcqMax) * 0.8 + monthlyMax) * 100) / 100;
}

// ─── GPA CALCULATION ───
export function calculateGPA(combinedResults: { mark: number; maxMark: number }[]): number {
  const grades = combinedResults.map(s => gradeAndGP(s.mark, s.maxMark));
  const hasFail = grades.some(g => g.grade === "F");
  if (hasFail) return 0.00;
  const sum = grades.reduce((t, g) => t + g.gp, 0);
  return Math.round((sum / GPA_SUBJECTS.length) * 100) / 100;
}

// ─── RANKING ───
export function calculateRanks(scores: { id: number; total: number; tieBreak?: number }[]): Map<number, number> {
  const sorted = [...scores].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return (b.tieBreak ?? 0) - (a.tieBreak ?? 0);
  });
  const rankMap = new Map<number, number>();
  let denseRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prev = sorted[i - 1], cur = sorted[i];
      if (cur.total < prev.total) denseRank++;
      else if (cur.total === prev.total && (cur.tieBreak ?? 0) < (prev.tieBreak ?? 0)) denseRank++;
    }
    rankMap.set(sorted[i].id, denseRank);
  }
  return rankMap;
}

export const GRADE_COLORS: Record<string, string> = {
  "A+": "#059669", A: "#10B981", "A-": "#34D399", B: "#006FEE",
  C: "#F59E0B", D: "#F97316", F: "#DC2626",
};

export const SCHOOL_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTZ8N1jkOgd4MHMNEN2wN70OWVAAkZt3ZlU6zqVnGadw&s=10";

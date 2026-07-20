export const CLASS_NAME = "Class 8";
export const SECTION_NAME = "Dahlia (B)";

export const SUBJECTS = [
  "Bangla 1st",
  "Bangla 2nd",
  "English 1st",
  "English 2nd",
  "Mathematics",
  "BGS",
  "Science",
  "Islam",
  "ICT",
] as const;

export type SubjectName = (typeof SUBJECTS)[number];

export interface SubjectConfig {
  name: SubjectName;
  cqMax: number;
  mcqMax: number;
  totalMax: number;
  hasMcq: boolean;
}

export const SUBJECT_CONFIGS: Record<string, SubjectConfig> = {
  "Bangla 1st": { name: "Bangla 1st", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  "Bangla 2nd": { name: "Bangla 2nd", cqMax: 35, mcqMax: 15, totalMax: 50, hasMcq: true },
  "English 1st": { name: "English 1st", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  "English 2nd": { name: "English 2nd", cqMax: 50, mcqMax: 0, totalMax: 50, hasMcq: false },
  Mathematics: { name: "Mathematics", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  BGS: { name: "BGS", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  Science: { name: "Science", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  Islam: { name: "Islam", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
  ICT: { name: "ICT", cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true },
};

export const EXAM_TYPES = [
  "1st Monthly",
  "2nd Monthly",
  "Half Yearly",
  "Annual",
] as const;

export type ExamType = (typeof EXAM_TYPES)[number];

export const MONTHLY_EXAMS = ["1st Monthly", "2nd Monthly"] as const;

// Default monthly full marks
export const DEFAULT_MONTHLY_FULL_MARKS: Record<string, number> = {
  "Bangla 1st": 20,
  "Bangla 2nd": 10,
  "English 1st": 20,
  "English 2nd": 10,
  Mathematics: 20,
  BGS: 20,
  Science: 20,
  Islam: 20,
  ICT: 20,
};

export function isMonthlyExam(exam: string): boolean {
  return exam === "1st Monthly" || exam === "2nd Monthly";
}

// Monthly exams have NO MCQ - only CQ (total mark)
export function getSubjectMaxForExam(
  subject: string,
  exam: string,
  customMarks?: Record<string, Record<string, number>> | null
): { cqMax: number; mcqMax: number; totalMax: number; hasMcq: boolean } {
  if (isMonthlyExam(exam)) {
    const customExamMarks = customMarks?.[exam];
    const total = customExamMarks?.[subject] ?? DEFAULT_MONTHLY_FULL_MARKS[subject] ?? 20;
    return { cqMax: total, mcqMax: 0, totalMax: total, hasMcq: false };
  }
  const config = SUBJECT_CONFIGS[subject];
  if (!config) return { cqMax: 70, mcqMax: 30, totalMax: 100, hasMcq: true };

  const customExamMarks = customMarks?.[exam];
  if (customExamMarks && customExamMarks[subject] !== undefined) {
    const total = customExamMarks[subject];
    if (!config.hasMcq) return { cqMax: total, mcqMax: 0, totalMax: total, hasMcq: false };
    const ratio = config.cqMax / (config.cqMax + config.mcqMax);
    const cq = Math.round(total * ratio);
    const mcq = total - cq;
    return { cqMax: cq, mcqMax: mcq, totalMax: total, hasMcq: true };
  }

  return { ...config };
}

export const PASS_MARK_PERCENT = 33;

export function calculateGrade(obtained: number, total: number): string {
  if (total === 0) return "N/A";
  const pct = (obtained / total) * 100;
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "A-";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  if (pct >= 33) return "D";
  return "F";
}

export function isPassing(obtained: number, total: number): boolean {
  if (total === 0) return false;
  return (obtained / total) * 100 >= PASS_MARK_PERCENT;
}

export function calculateRanks(scores: { id: number; total: number }[]): Map<number, number> {
  const sorted = [...scores].sort((a, b) => b.total - a.total);
  const rankMap = new Map<number, number>();
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].total < sorted[i - 1].total) {
      currentRank = i + 1;
    }
    rankMap.set(sorted[i].id, currentRank);
  }
  return rankMap;
}

export const GRADE_COLORS: Record<string, string> = {
  "A+": "#059669",
  A: "#10B981",
  "A-": "#34D399",
  B: "#006FEE",
  C: "#F59E0B",
  D: "#F97316",
  F: "#DC2626",
};

export const SCHOOL_LOGO_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTZ8N1jkOgd4MHMNEN2wN70OWVAAkZt3ZlU6zqVnGadw&s=10";

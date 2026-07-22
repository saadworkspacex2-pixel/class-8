export const CLASS_NAME = "Class 8";
export const SECTION_NAME = "Dahlia (B)";
export const SECTIONS = ["shapla", "dahlia"] as const;
export type Section = (typeof SECTIONS)[number];
export function getSectionFromRoll(roll: number): Section {
  return roll % 2 === 1 ? "shapla" : "dahlia";
}
export function getAvailableRolls(section: Section): number[] {
  if (section === "shapla") {
    // Odd rolls: 1,3,5...219
    return Array.from({ length: 110 }, (_, i) => i * 2 + 1);
  } else {
    // Even rolls: 2,4,6...222
    return Array.from({ length: 111 }, (_, i) => (i + 1) * 2);
  }
}
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
export function calculateGrade(
  obtained: number, 
  total: number, 
  cqObtained?: number, 
  cqMax?: number, 
  mcqObtained?: number | null
): string {
  if ((mcqObtained === undefined || mcqObtained === null) && cqObtained !== undefined && cqMax && cqMax > 0) {
    const cqPct = (cqObtained / cqMax) * 100;
    if (cqPct >= 80) return "A+";
    if (cqPct >= 70) return "A";
    if (cqPct >= 60) return "A-";
    if (cqPct >= 50) return "B";
    if (cqPct >= 40) return "C";
    if (cqPct >= 33) return "D";
    return "F";
  }
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
export function isPassing(
  obtained: number, 
  total: number, 
  cqObtained?: number, 
  cqMax?: number, 
  mcqObtained?: number | null
): boolean {
  if ((mcqObtained === undefined || mcqObtained === null) && cqObtained !== undefined && cqMax && cqMax > 0) {
    return (cqObtained / cqMax) * 100 >= PASS_MARK_PERCENT;
  }
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
// === GPA SYSTEM ===
// Grade to grade point mapping (Bangladesh standard)
export function gradeToGradePoint(grade: string): number {
  switch (grade) {
    case "A+": return 5.00;
    case "A":  return 4.00;
    case "A-": return 3.50;
    case "B":  return 3.00;
    case "C":  return 2.00;
    case "D":  return 1.00;
    case "F":  return 0.00;
    default:   return 0.00;
  }
}
// Calculate GPA from an array of grades
export function calculateGPA(grades: string[]): number {
  if (grades.length === 0) return 0;
  const hasFail = grades.some(g => g === "F");
  if (hasFail) return 0.00;
  const total = grades.reduce((sum, g) => sum + gradeToGradePoint(g), 0);
  return Math.round((total / grades.length) * 100) / 100;
}
// === NEW MARK CALCULATION: For Half Yearly/Annual ===
// final_total = (cq + mcq) * 0.8 + monthly_mark
// Where monthly_mark is the mark from 1st Monthly or 2nd Monthly for that subject
export function calculateFinalTotal(
  cq: number,
  mcq: number,
  cqMax: number,
  mcqMax: number,
  monthlyMark: number
): { rawTotal: number; weightedTotal: number; finalTotal: number } {
  const rawTotal = cq + mcq;
  const weightedTotal = Math.round((rawTotal / (cqMax + mcqMax || 1)) * 80 * 100) / 100; // 80% of total possible
  // The actual formula: 80% of obtained marks (scaled) + monthly marks
  const scaled80 = Math.round((rawTotal * 80) / (cqMax + mcqMax || 1) * 100) / 100;
  const finalTotal = scaled80 + monthlyMark;
  return { rawTotal, weightedTotal: Math.round(weightedTotal * 100) / 100, finalTotal: Math.round(finalTotal * 100) / 100 };
}
// Get maximum final total for a subject in Half Yearly/Annual
export function getFinalMaxTotal(cqMax: number, mcqMax: number, monthlyMax: number): number {
  return 80 + monthlyMax; // 80% of (cqMax+mcqMax) = 80, plus monthly max
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

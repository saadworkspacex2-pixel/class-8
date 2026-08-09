export interface AttendanceRecord {
  id?: number;
  studentId: number;
  date: string;
  status: string; // "present" | "absent" | "late" | "excused"
  remarks?: string | null;
}

export function computeAttendanceStats(records: AttendanceRecord[]) {
  const total = records.length;
  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;
  const excused = records.filter(r => r.status === "excused").length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

  return {
    total,
    present,
    absent,
    late,
    excused,
    percentage,
  };
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance, students } from "@/db/schema";
import { computeAttendanceStats } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allStudents = await db.select().from(students);
    const allAttendance = await db.select().from(attendance);

    const leaderboard = allStudents.map((s) => {
      const studentRecords = allAttendance.filter((a) => a.studentId === s.id);
      const stats = computeAttendanceStats(studentRecords);
      return {
        studentId: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        profilePicture: s.profilePicture,
        ...stats,
      };
    });

    leaderboard.sort((a, b) => b.percentage - a.percentage || b.present - a.present);

    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch attendance leaderboard" }, { status: 500 });
  }
}

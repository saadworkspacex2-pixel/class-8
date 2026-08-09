import { NextResponse } from "next/server";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { computeAttendanceStats } from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "student" || !session.studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, session.studentId));

    const stats = computeAttendanceStats(records);

    return NextResponse.json({ records, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch student attendance" }, { status: 500 });
  }
}

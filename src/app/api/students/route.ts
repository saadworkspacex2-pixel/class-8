import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, settings } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const allStudents = await db
      .select()
      .from(students)
      .orderBy(asc(students.rollNumber));
    return NextResponse.json(allStudents);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch students";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, rollNumber, password } = body;

    if (!name || !rollNumber || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Secondary admin — queue for approval
    const check = await queueIfSecondary(session, "create_student", `Add student: ${name} (Roll ${rollNumber})`, "/api/students", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });

    // Check duplicate
    const existing = await db
      .select()
      .from(students)
      .where(eq(students.rollNumber, rollNumber))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "Roll number already exists" }, { status: 400 });
    }

    const newStudent = await db
      .insert(students)
      .values({
        name,
        rollNumber: parseInt(rollNumber),
        password,
        profilePicture: body.profilePicture || "",
      })
      .returning();

    // Auto-increment next roll number in settings
    const nextRoll = parseInt(rollNumber) + 2;
    await db.update(settings).set({ nextRollNumber: nextRoll }).where(eq(settings.id, 1));

    return NextResponse.json(newStudent[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create student";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, students } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const all = await db.select().from(applications).orderBy(desc(applications.createdAt));
    return NextResponse.json(all);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, rollNumber, studentId, fatherName, motherName, mobileNumber } = body;

    if (!name || !rollNumber) {
      return NextResponse.json({ error: "Name and roll number are required" }, { status: 400 });
    }

    // Check if roll already exists in students
    const existingStudent = await db
      .select()
      .from(students)
      .where(eq(students.rollNumber, parseInt(rollNumber)))
      .limit(1);
    if (existingStudent.length > 0) {
      return NextResponse.json({ error: "This roll number is already registered" }, { status: 400 });
    }

    // Check if there's already a pending application for this roll
    const existingApp = await db
      .select()
      .from(applications)
      .where(eq(applications.rollNumber, parseInt(rollNumber)))
      .limit(1);
    if (existingApp.length > 0 && existingApp[0].status === "pending") {
      return NextResponse.json({ error: "An application for this roll number is already pending" }, { status: 400 });
    }

    const created = await db.insert(applications).values({
      name,
      rollNumber: parseInt(rollNumber),
      studentId: studentId || "",
      fatherName: fatherName || "",
      motherName: motherName || "",
      mobileNumber: mobileNumber || "",
      status: "pending",
    }).returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

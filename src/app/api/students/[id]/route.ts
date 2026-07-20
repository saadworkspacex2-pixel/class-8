import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, marks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await db.select().from(students).where(eq(students.id, parseInt(id))).limit(1);
    if (student.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(student[0]);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    const check = await queueIfSecondary(session, "edit_student", `Edit student (ID ${id}): ${body.name || "update"}`, `/api/students/${id}`, "PUT", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });

    const updated = await db.update(students).set({ ...body, updatedAt: new Date() }).where(eq(students.id, parseInt(id))).returning();
    return NextResponse.json(updated[0]);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const student = await db.select().from(students).where(eq(students.id, parseInt(id))).limit(1);
    const name = student[0]?.name || `ID ${id}`;

    const check = await queueIfSecondary(session, "delete_student", `Delete student: ${name} (Roll ${student[0]?.rollNumber || "?"})`, `/api/students/${id}`, "DELETE", {});
    if (check.queued) return NextResponse.json(check.response, { status: 202 });

    await db.delete(marks).where(eq(marks.studentId, parseInt(id)));
    await db.delete(students).where(eq(students.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "approve" or "reject"

    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, parseInt(id)))
      .limit(1);

    if (app.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = app[0];

    const check = await queueIfSecondary(session, "review_application", `${action === "approve" ? "Approve" : "Reject"} application: "${application.name}" (Roll ${application.rollNumber})`, `/api/applications/${id}`, "PUT", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });

    if (action === "approve") {
      // Check if roll number is still available
      const existingStudent = await db
        .select()
        .from(students)
        .where(eq(students.rollNumber, application.rollNumber))
        .limit(1);

      if (existingStudent.length > 0) {
        return NextResponse.json({ error: "Roll number already taken" }, { status: 400 });
      }

      // Create the student
      const defaultPassword = `student${application.rollNumber}`;
      await db.insert(students).values({
        name: application.name,
        rollNumber: application.rollNumber,
        password: defaultPassword,
        studentId: application.studentId || "",
        fatherName: application.fatherName || "",
        motherName: application.motherName || "",
        mobileNumber: application.mobileNumber || "",
      });

      // Update application status
      await db
        .update(applications)
        .set({ status: "approved" })
        .where(eq(applications.id, parseInt(id)));

      return NextResponse.json({ success: true, message: "Student approved and created", password: defaultPassword });
    } else if (action === "reject") {
      await db
        .update(applications)
        .set({ status: "rejected" })
        .where(eq(applications.id, parseInt(id)));

      return NextResponse.json({ success: true, message: "Application rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(applications).where(eq(applications.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

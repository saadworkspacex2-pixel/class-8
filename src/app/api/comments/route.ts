import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (studentId) {
      const rows = await db.select().from(comments).where(eq(comments.studentId, parseInt(studentId))).orderBy(desc(comments.createdAt));
      return NextResponse.json(rows);
    }
    return NextResponse.json(await db.select().from(comments).orderBy(desc(comments.createdAt)));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const check = await queueIfSecondary(session, "add_comment", `Add teacher comment by "${body.teacherName || "?"}" for student ID ${body.studentId}`, "/api/comments", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    const created = await db.insert(comments).values({ studentId: body.studentId, teacherName: body.teacherName, teacherSubject: body.teacherSubject || "", teacherPicture: body.teacherPicture || "", comment: body.comment, type: body.type || "positive" }).returning();
    return NextResponse.json(created[0], { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const check = await queueIfSecondary(session, "delete_comment", `Delete teacher comment (ID ${id})`, `/api/comments?id=${id}`, "DELETE", {});
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    await db.delete(comments).where(eq(comments.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

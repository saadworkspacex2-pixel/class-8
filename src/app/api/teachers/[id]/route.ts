import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const check = await queueIfSecondary(session, "edit_teacher", `Edit teacher (ID ${id}): "${body.name || "update"}"`, `/api/teachers/${id}`, "PUT", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    const updated = await db.update(teachers).set(body).where(eq(teachers.id, parseInt(id))).returning();
    return NextResponse.json(updated[0]);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const teacher = await db.select().from(teachers).where(eq(teachers.id, parseInt(id))).limit(1);
    const check = await queueIfSecondary(session, "delete_teacher", `Delete teacher: "${teacher[0]?.name || `ID ${id}`}"`, `/api/teachers/${id}`, "DELETE", {});
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    await db.delete(teachers).where(eq(teachers.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { homework } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hw = await db.select().from(homework).orderBy(desc(homework.updatedAt));
    return NextResponse.json(hw);
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const check = await queueIfSecondary(session, "add_homework", `Add HW: ${body.title}`, "/api/homework", "POST", body);
  if (check.queued) return NextResponse.json(check.response, { status: 202 });
  const r = await db.insert(homework).values({ subject: body.subject, title: body.title, description: body.description || "", dueDate: body.dueDate || "" }).returning();
  return NextResponse.json(r[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const check = await queueIfSecondary(session, "update_homework", `Update HW #${id}`, "/api/homework", "PUT", body);
  if (check.queued) return NextResponse.json(check.response, { status: 202 });
  const r = await db.update(homework).set({ subject: body.subject, title: body.title, description: body.description, dueDate: body.dueDate, updatedAt: new Date() }).where(eq(homework.id, id)).returning();
  return NextResponse.json(r[0]);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "0");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const check = await queueIfSecondary(session, "delete_homework", `Delete HW #${id}`, `/api/homework?id=${id}`, "DELETE", {});
  if (check.queued) return NextResponse.json(check.response, { status: 202 });
  await db.delete(homework).where(eq(homework.id, id));
  return NextResponse.json({ success: true });
}

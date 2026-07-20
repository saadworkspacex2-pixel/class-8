import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { routine } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    let query = db.select().from(routine).orderBy(asc(routine.dayOfWeek), asc(routine.periodNumber));
    if (day !== null) query = query.where(eq(routine.dayOfWeek, parseInt(day))) as typeof query;
    const rows = await query;
    return NextResponse.json(rows);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const check = await queueIfSecondary(session, "add_routine", `Add routine: ${body.subject || "period"} (Day ${body.dayOfWeek})`, "/api/routine", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    const created = await db.insert(routine).values(body).returning();
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
    const check = await queueIfSecondary(session, "delete_routine", `Delete routine period (ID ${id})`, `/api/routine?id=${id}`, "DELETE", {});
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    await db.delete(routine).where(eq(routine.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

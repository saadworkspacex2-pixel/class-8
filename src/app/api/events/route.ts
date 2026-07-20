import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { upcomingEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json(await db.select().from(upcomingEvents).orderBy(desc(upcomingEvents.createdAt))); }
  catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const check = await queueIfSecondary(session, "add_event", `Add event: "${body.title || "Untitled"}" on ${body.eventDate || "?"}`, "/api/events", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    const created = await db.insert(upcomingEvents).values(body).returning();
    return NextResponse.json(created[0], { status: 201 });
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const check = await queueIfSecondary(session, "delete_event", `Delete event (ID ${id})`, `/api/events?id=${id}`, "DELETE", {});
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    await db.delete(upcomingEvents).where(eq(upcomingEvents.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) { return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 }); }
}

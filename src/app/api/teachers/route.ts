import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getSession, isAnyAdmin } from "@/lib/auth";
import { queueIfSecondary } from "@/lib/pending";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const all = await db.select().from(teachers).orderBy(asc(teachers.id));
    return NextResponse.json(all);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAnyAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const check = await queueIfSecondary(session, "add_teacher", `Add teacher: "${body.name}" (${body.subject || "General"})`, "/api/teachers", "POST", body);
    if (check.queued) return NextResponse.json(check.response, { status: 202 });
    const created = await db.insert(teachers).values({ name: body.name, degree: body.degree || "", subject: body.subject || "", profilePicture: body.profilePicture || "" }).returning();
    return NextResponse.json(created[0], { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

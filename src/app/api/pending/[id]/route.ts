import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pendingChanges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, isSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "Only super admin can approve" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "approve" or "reject"

    const rows = await db.select().from(pendingChanges).where(eq(pendingChanges.id, parseInt(id))).limit(1);
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const change = rows[0];

    if (action === "approve") {
      // Execute the original API call internally
      try {
        const baseUrl = req.nextUrl.origin;
        const apiRes = await fetch(`${baseUrl}${change.endpoint}`, {
          method: change.method,
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.get("cookie") || "",
          },
          body: change.method !== "DELETE" ? JSON.stringify(change.payload) : undefined,
        });

        if (apiRes.ok) {
          await db.update(pendingChanges).set({ status: "approved" }).where(eq(pendingChanges.id, parseInt(id)));
          return NextResponse.json({ success: true, message: "Change approved and applied" });
        } else {
          const errData = await apiRes.json().catch(() => ({}));
          return NextResponse.json({ error: "Failed to apply change", details: errData }, { status: 500 });
        }
      } catch (err) {
        return NextResponse.json({ error: "Failed to execute change" }, { status: 500 });
      }
    } else if (action === "reject") {
      await db.update(pendingChanges).set({ status: "rejected" }).where(eq(pendingChanges.id, parseInt(id)));
      return NextResponse.json({ success: true, message: "Change rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: "Only super admin" }, { status: 401 });
    }
    const { id } = await params;
    await db.delete(pendingChanges).where(eq(pendingChanges.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

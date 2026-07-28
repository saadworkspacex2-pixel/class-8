import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students, settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function setCookie(res: NextResponse, token: string) {
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 86400,
    path: "/",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, rollNumber, password } = body;

    if (role === "admin") {
      const settingsRows = await db.select().from(settings).limit(1);
      let s = settingsRows[0];
      if (!s) {
        await db.insert(settings).values({ adminPassword: "admin123", superAdminPassword: "saad.admin" });
        const newRows = await db.select().from(settings).limit(1);
        s = newRows[0];
      }

      // Super admin (developer) — full access
      const superPass = s?.superAdminPassword || "saad.admin";
      if (password === superPass) {
        const token = await createToken({ role: "admin" });
        const res = NextResponse.json({ success: true, role: "admin" });
        setCookie(res, token);
        return res;
      }

      // Secondary admin — restricted, changes need approval
      const adminPass = s?.adminPassword || "admin123";
      if (password === adminPass) {
        const token = await createToken({ role: "secondary_admin" });
        const res = NextResponse.json({ success: true, role: "secondary_admin" });
        setCookie(res, token);
        return res;
      }

      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (role === "student") {
      const roll = parseInt(rollNumber);
      if (isNaN(roll)) {
        return NextResponse.json({ error: "Invalid roll number" }, { status: 400 });
      }
      const studentRows = await db
        .select()
        .from(students)
        .where(eq(students.rollNumber, roll))
        .limit(1);
      const student = studentRows[0];
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      if (student.password !== password) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }
      const token = await createToken({
        role: "student",
        studentId: student.id,
        rollNumber: student.rollNumber,
      });
      const res = NextResponse.json({
        success: true,
        role: "student",
        studentId: student.id,
      });
      setCookie(res, token);
      return res;
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

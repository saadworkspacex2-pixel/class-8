import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sunshine-academy-secret-key-2025"
);

export interface TokenPayload {
  role: "admin" | "secondary_admin" | "student";
  studentId?: number;
  rollNumber?: number;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Check if current session is super admin (full access)
export function isSuperAdmin(session: TokenPayload | null): boolean {
  return session?.role === "admin";
}

// Check if current session is any admin (super or secondary)
export function isAnyAdmin(session: TokenPayload | null): boolean {
  return session?.role === "admin" || session?.role === "secondary_admin";
}

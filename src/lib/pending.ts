import { db } from "@/db";
import { pendingChanges } from "@/db/schema";
import { type TokenPayload } from "@/lib/auth";

/**
 * If the session is secondary_admin, queue the change for approval instead of executing it.
 * Returns { queued: true } if queued, { queued: false } if super admin (proceed normally).
 */
export async function queueIfSecondary(
  session: TokenPayload,
  actionType: string,
  actionLabel: string,
  endpoint: string,
  method: string,
  payload: Record<string, unknown>
): Promise<{ queued: boolean; response?: { message: string } }> {
  if (session.role === "admin") {
    // Super admin — proceed normally
    return { queued: false };
  }

  // Secondary admin — queue the change
  await db.insert(pendingChanges).values({
    actionType,
    actionLabel,
    endpoint,
    method,
    payload,
    status: "pending",
  });

  return {
    queued: true,
    response: { message: "Your change has been submitted for approval by the super admin." },
  };
}

import "server-only";

import { ZodError } from "zod";
import { getMobileUserFromHeaders, type CurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/session";
import type { Role } from "@prisma/client";

const noStore = { "Cache-Control": "no-store" };

export async function authenticateMobileRequest(
  request: Request,
  allowedRoles: readonly Role[],
): Promise<{ actor: CurrentUser; response?: never } | { actor?: never; response: Response }> {
  const actor = await getMobileUserFromHeaders(request.headers);
  if (!actor) {
    return { response: Response.json({ error: "UNAUTHENTICATED" }, { status: 401, headers: noStore }) };
  }
  if (!allowedRoles.includes(actor.role)) {
    return { response: Response.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore }) };
  }
  return { actor };
}

export function mobileApiError(error: unknown) {
  if (error instanceof AuthorizationError) {
    return Response.json({ error: "FORBIDDEN" }, { status: 403, headers: noStore });
  }
  if (error instanceof ZodError) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 422, headers: noStore });
  }
  if (error instanceof SyntaxError) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400, headers: noStore });
  }

  const code = error instanceof Error ? error.message : "";
  if (code === "SESSION_NOT_FOUND") {
    return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: noStore });
  }
  if (["SESSION_LOCKED", "SESSION_CANCELLED", "ADMIN_CORRECTION_REQUIRED"].includes(code)) {
    return Response.json({ error: "SESSION_NOT_EDITABLE" }, { status: 409, headers: noStore });
  }
  if (["INCOMPLETE_ATTENDANCE", "UNEXPECTED_ATTENDANCE_USER"].includes(code)) {
    return Response.json({ error: code }, { status: 422, headers: noStore });
  }
  return Response.json({ error: "INTERNAL_ERROR" }, { status: 500, headers: noStore });
}

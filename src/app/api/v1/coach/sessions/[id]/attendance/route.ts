import { Role } from "@prisma/client";
import { z } from "zod";
import { authenticateMobileRequest, mobileApiError } from "@/lib/api/mobile";
import { getAttendanceSheet, saveAttendanceDraft, submitAttendance } from "@/lib/services/attendance";

const requestSchema = z.object({
  intent: z.enum(["draft", "submit"]),
  entries: z.array(z.unknown()),
});

export async function GET(request: Request, context: RouteContext<"/api/v1/coach/sessions/[id]/attendance">) {
  const authResult = await authenticateMobileRequest(request, [Role.COACH]);
  if (authResult.response) return authResult.response;
  const { id } = await context.params;

  try {
    const sheet = await getAttendanceSheet(authResult.actor, id);
    if (!sheet) return Response.json({ error: "NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });

    return Response.json({
      session: {
        id: sheet.session.id,
        category: sheet.session.category,
        type: sheet.session.type,
        status: sheet.session.status,
        startsAt: sheet.session.startsAt.toISOString(),
        endsAt: sheet.session.endsAt?.toISOString() ?? null,
        location: sheet.session.location,
      },
      participants: [
        ...sheet.roster.players.map((person) => ({ id: person.id, firstName: person.firstName, lastName: person.lastName, role: "PLAYER" })),
        ...sheet.roster.coaches.map((person) => ({ id: person.id, firstName: person.firstName, lastName: person.lastName, role: "COACH" })),
        ...sheet.roster.dirigeants.map((person) => ({ id: person.id, firstName: person.firstName, lastName: person.lastName, role: "DIRIGEANT" })),
      ],
      records: sheet.records.map((record) => ({
        userId: record.userId,
        status: record.status,
        note: record.note,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return mobileApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext<"/api/v1/coach/sessions/[id]/attendance">) {
  const authResult = await authenticateMobileRequest(request, [Role.COACH]);
  if (authResult.response) return authResult.response;
  const { id } = await context.params;

  try {
    const payload = requestSchema.parse(await request.json());
    const input = { sessionId: id, entries: payload.entries };
    const result = payload.intent === "submit"
      ? await submitAttendance(authResult.actor, input)
      : await saveAttendanceDraft(authResult.actor, input);
    return Response.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return mobileApiError(error);
  }
}

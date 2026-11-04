import { Role } from "@prisma/client";
import { authenticateMobileRequest } from "@/lib/api/mobile";
import { getSessionsForUser } from "@/lib/services/sessions";

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request, [Role.COACH]);
  if (authResult.response) return authResult.response;

  const sessions = await getSessionsForUser(authResult.actor, 100);
  return Response.json({
    sessions: sessions.map((session) => ({
      id: session.id,
      categoryId: session.categoryId,
      category: session.category,
      type: session.type,
      status: session.status,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt?.toISOString() ?? null,
      location: session.location,
      attendanceCount: session._count.attendanceRecords,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

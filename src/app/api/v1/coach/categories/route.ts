import { Role } from "@prisma/client";
import { authenticateMobileRequest } from "@/lib/api/mobile";
import { getAccessibleCategories } from "@/lib/auth/authorization";

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request, [Role.COACH]);
  if (authResult.response) return authResult.response;

  const categories = await getAccessibleCategories(authResult.actor, new Date());
  return Response.json({ categories }, { headers: { "Cache-Control": "no-store" } });
}

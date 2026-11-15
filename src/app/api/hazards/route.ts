import { queryHazards } from "@/features/hazards/server/service";
import { responseStatus } from "@/features/hazards/server/query";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const result = await queryHazards();
  return Response.json(result, {
    status: responseStatus(result),
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}

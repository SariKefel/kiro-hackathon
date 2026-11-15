import { NextResponse } from "next/server";
import { syncRequestSchema } from "@/lib/validations/check-in";
import { synchronizeCheckIns } from "@/features/sync/service";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected application/json." }, { status: 415 });
  }
  // Bound streamed input before parsing, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Request body required." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65_536) {
        await reader.cancel();
        return NextResponse.json({ error: "Request exceeds 64 KiB." }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed = syncRequestSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid sync request.", issues: parsed.error.issues },
        { status: 400 },
      );
    return NextResponse.json(synchronizeCheckIns(parsed.data.operations), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
}

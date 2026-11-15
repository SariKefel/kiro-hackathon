const MAX_BODY_BYTES = 2 * 1024 * 1024;

export class FeedFailure extends Error {
  constructor(
    message: string,
    readonly retryUntil?: number,
  ) {
    super(message);
  }
}

export async function retrieveJson(
  url: string,
  transport: (url: string, init?: RequestInit) => Promise<Response>,
  now: () => number = Date.now,
) {
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      void reader?.cancel().catch(() => undefined);
      reject(new FeedFailure("Source retrieval timed out"));
    }, 8000);
  });
  const work = (async () => {
    const response = await transport(url, {
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok || response.redirected) {
      const header = response.headers.get("retry-after")?.slice(0, 128);
      const parsedRetry = header
        ? /^\d+$/.test(header)
          ? now() + Number(header) * 1000
          : Date.parse(header)
        : NaN;
      const retryUntil =
        Number.isFinite(parsedRetry) && Math.abs(parsedRetry) <= 8.64e15
          ? Math.max(now() + 30000, parsedRetry)
          : undefined;
      void response.body?.cancel().catch(() => undefined);
      throw new FeedFailure(
        response.status === 429 ? "Source is throttling retrieval" : "Source retrieval unavailable",
        retryUntil,
      );
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (contentLength > MAX_BODY_BYTES || !response.body) {
      await response.body?.cancel();
      throw new FeedFailure("Source response exceeded the supported size or was empty");
    }
    reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BODY_BYTES)
          throw new FeedFailure("Source response exceeded the supported size");
        chunks.push(value);
      }
    } catch (error) {
      void reader.cancel().catch(() => undefined);
      throw error;
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  })();
  try {
    return await Promise.race([work, timeout]);
  } catch (error) {
    if (controller.signal.aborted) throw new FeedFailure("Source retrieval timed out");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

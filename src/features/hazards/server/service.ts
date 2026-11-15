import "server-only";
import { cachedSnapshot } from "./cache";
import { createHazardQuery } from "./query";

export const queryHazards = createHazardQuery({ cacheSnapshot: cachedSnapshot });

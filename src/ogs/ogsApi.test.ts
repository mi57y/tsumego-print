import { expect, it, vi } from "vitest";
import {
  createCollectionsApi,
  type CollectionEntry,
  type CollectionPage,
} from "./ogsApi";

const DEFAULT_URL = "https://online-go.com/api/v1";

interface Call {
  url: string;
  body: unknown;
  status: number;
}

function stubFetch(responses: Partial<Record<string, unknown>> = {}) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push({ url, body: responses[url], status: 200 });
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => responses[url],
    } as unknown as Response;
  }) as typeof fetch;
  return { calls, fetchImpl };
}

function collectionEntry(id: number): CollectionEntry {
  return {
    id,
    name: `Collection ${id}`,
    owner: { username: "owner" },
    rating: 4,
    rating_count: 10,
    puzzle_count: 5,
  };
}

const PAGE_BODY: CollectionPage = {
  results: [collectionEntry(1)],
  count: 1,
};

it("fetchCollectionPage builds URL from baseUrl with defaults", async () => {
  const { calls, fetchImpl } = stubFetch({
    "https://example.com/api/v1/puzzles/collections/?page=2&page_size=10&ordering=-rating":
      PAGE_BODY,
  });
  const api = createCollectionsApi({
    baseUrl: "https://example.com/api/v1",
    fetchImpl,
  });
  await api.fetchCollectionPage("", 2);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.url).toBe(
    "https://example.com/api/v1/puzzles/collections/?page=2&page_size=10&ordering=-rating",
  );
});

it("fetchCollectionPage adds name__icontains only for non-empty query", async () => {
  const { calls, fetchImpl } = stubFetch({
    [`${DEFAULT_URL}/puzzles/collections/?page=1&page_size=10&ordering=name&name__icontains=foo`]:
      PAGE_BODY,
  });
  const api = createCollectionsApi({ fetchImpl });
  await api.fetchCollectionPage("foo", 1, "name");
  expect(calls).toHaveLength(1);
  expect(calls[0]?.url).toBe(
    `${DEFAULT_URL}/puzzles/collections/?page=1&page_size=10&ordering=name&name__icontains=foo`,
  );
});

it("fetchCollection uses baseUrl and returns entry", async () => {
  const { calls, fetchImpl } = stubFetch({
    [`${DEFAULT_URL}/puzzles/collections/42`]: collectionEntry(42),
  });
  const api = createCollectionsApi({ fetchImpl });
  const entry = await api.fetchCollection(42);
  expect(calls[0]?.url).toBe(`${DEFAULT_URL}/puzzles/collections/42`);
  expect(entry.name).toBe("Collection 42");
});

it("fetchPuzzlesOfCollection uses baseUrl and returns array", async () => {
  const { calls, fetchImpl } = stubFetch({
    [`${DEFAULT_URL}/puzzles/collections/7/puzzles`]: [],
  });
  const api = createCollectionsApi({ fetchImpl });
  const puzzles = await api.fetchPuzzlesOfCollection(7);
  expect(calls[0]?.url).toBe(`${DEFAULT_URL}/puzzles/collections/7/puzzles`);
  expect(puzzles).toEqual([]);
});

it("fetchCollectionPage rejects non-array results", async () => {
  const fetchImpl = (async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ results: "nope" }),
  })) as unknown as typeof fetch;
  const api = createCollectionsApi({ fetchImpl });
  await expect(api.fetchCollectionPage("", 1)).rejects.toThrow(
    "unexpected API response: expected an array of collections",
  );
});

it("fetchCollectionPage surfaces error detail from non-ok responses", async () => {
  const fetchImpl = (async () => ({
    ok: false,
    status: 400,
    statusText: "Bad Request",
    json: async () => ({ detail: "boom" }),
  })) as unknown as typeof fetch;
  const api = createCollectionsApi({ fetchImpl });
  await expect(api.fetchCollectionPage("", 3)).rejects.toThrow(
    "Failed to load collections (page 3): 400 Bad Request - boom",
  );
});

it("fetchCollection rejects an entry with a missing name", async () => {
  const fetchImpl = (async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ id: 9, owner: { username: "owner" } }),
  })) as unknown as typeof fetch;
  const api = createCollectionsApi({ fetchImpl });
  await expect(api.fetchCollection(9)).rejects.toThrow(
    "unexpected API response: expected a collection name",
  );
});

it("non-ok responses without a JSON body produce the uniform error message", async () => {
  const fetchImpl = (async () => ({
    ok: false,
    status: 503,
    statusText: "Service Unavailable",
    json: async () => {
      throw new SyntaxError("no body");
    },
  })) as unknown as typeof fetch;
  const api = createCollectionsApi({ fetchImpl });
  await expect(api.fetchCollection(5)).rejects.toThrow(
    "Failed to load collection 5: 503 Service Unavailable",
  );
});

it("all fetchers reject non-ok with the same detail-suffix format", async () => {
  const fetchImpl = (async () => ({
    ok: false,
    status: 429,
    statusText: "Too Many Requests",
    json: async () => ({ detail: "slow down" }),
  })) as unknown as typeof fetch;
  const api = createCollectionsApi({
    fetchImpl,
    recommendedCollectionIds: [1],
  });
  await expect(api.fetchCollectionPage("", 1)).rejects.toThrow(
    "Failed to load collections (page 1): 429 Too Many Requests - slow down",
  );
  await expect(api.fetchCollection(1)).rejects.toThrow(
    "Failed to load collection 1: 429 Too Many Requests - slow down",
  );
  await expect(api.fetchPuzzlesOfCollection(1)).rejects.toThrow(
    "Failed to load puzzles of collection 1: 429 Too Many Requests - slow down",
  );
});

it("fetchRecommendedCollections requests all ids concurrently and preserves order", async () => {
  const calls: string[] = [];
  const responses = new Map<string, unknown>();
  for (const id of [15, 1, 7]) {
    responses.set(
      `${DEFAULT_URL}/puzzles/collections/${id}`,
      collectionEntry(id),
    );
  }
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => responses.get(url),
    } as unknown as Response;
  }) as typeof fetch;
  const api = createCollectionsApi({
    recommendedCollectionIds: [15, 1, 7],
    fetchImpl,
  });
  const entries = await api.fetchRecommendedCollections();
  expect(calls).toHaveLength(3);
  expect(entries.map((entry) => entry.id)).toEqual([15, 1, 7]);
});

it("fetchRecommendedCollections drops failed ids with only a console warning", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const responses = new Map<string, unknown>();
  for (const id of [1329, 47, 1363]) {
    responses.set(
      `${DEFAULT_URL}/puzzles/collections/${id}`,
      collectionEntry(id),
    );
  }
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `${DEFAULT_URL}/puzzles/collections/47`) {
      throw new TypeError("network down");
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => responses.get(url),
    } as unknown as Response;
  }) as typeof fetch;
  const api = createCollectionsApi({
    recommendedCollectionIds: [1329, 47, 1363],
    fetchImpl,
  });
  const entries = await api.fetchRecommendedCollections();
  expect(entries).toHaveLength(2);
  expect(entries[0]?.name).toBe("Collection 1329");
  expect(entries[1]?.name).toBe("Collection 1363");
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain("47");
  expect(String(warn.mock.calls[0]?.[0])).toContain("dropping it");
  warn.mockRestore();
});

it("fetchRecommendedCollections uses env ids, filtering invalid entries", async () => {
  vi.stubEnv("VITE_OGS_RECOMMENDED_COLLECTION_IDS", "1329, abc, 47, 0, -5");
  try {
    const calls: string[] = [];
    const responses = new Set<string>([
      `${DEFAULT_URL}/puzzles/collections/1329`,
      `${DEFAULT_URL}/puzzles/collections/47`,
    ]);
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => (responses.has(url) ? { name: "x" } : undefined),
      } as unknown as Response;
    }) as typeof fetch;
    const api = createCollectionsApi({ fetchImpl });
    await api.fetchRecommendedCollections();
    expect(calls.sort()).toEqual([
      `${DEFAULT_URL}/puzzles/collections/1329`,
      `${DEFAULT_URL}/puzzles/collections/47`,
    ]);
  } finally {
    vi.unstubAllEnvs();
  }
});

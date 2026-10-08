export interface MoveTreeNode {
  x: number;
  y: number;
  correct_answer?: boolean;
  wrong_answer?: boolean;
  text?: string;
  branches?: MoveTreeNode[];
}

export interface PuzzleEntry {
  id: number;
  puzzle: {
    move_tree: MoveTreeNode;
    initial_player: string;
    puzzle_description?: string;
    width: number;
    height: number;
    initial_state: {
      white: string;
      black: string;
    };
  };
}

export type OgsPuzzle = PuzzleEntry & {
  name: string;
};

export interface CollectionEntry {
  id: number;
  name: string;
  owner: {
    username: string;
  };
  rating: number | null;
  rating_count: number;
  puzzle_count: number;
}

export interface CollectionPage {
  results: CollectionEntry[];
  count: number;
}

export interface CollectionsApiOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  recommendedCollectionIds?: number[];
}

export interface CollectionsApi {
  fetchCollectionPage(
    query: string,
    page: number,
    ordering?: string,
    pageSize?: number,
  ): Promise<CollectionPage>;
  fetchCollection(id: number): Promise<CollectionEntry>;
  fetchPuzzlesOfCollection(collectionId: number): Promise<OgsPuzzle[]>;
  fetchRecommendedCollections(): Promise<CollectionEntry[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fail(message: string): never {
  throw new Error(`unexpected API response: ${message}`);
}

async function json(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    fail("response body is not JSON");
  }
}

async function responseError(
  response: Response,
  action: string,
): Promise<Error> {
  let suffix = "";
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") suffix = ` - ${body.detail}`;
  } catch {
    // noop
  }
  return new Error(
    `${action}: ${response.status} ${response.statusText}${suffix}`,
  );
}

function validateCollectionEntry(value: unknown): CollectionEntry {
  if (!isRecord(value)) fail("expected a collection object");
  const owner = value.owner;
  if (!isRecord(owner) || typeof owner.username !== "string") {
    fail("expected a collection owner name");
  }
  if (typeof value.id !== "number") fail("expected a collection id");
  if (typeof value.name !== "string") fail("expected a collection name");
  const rating = value.rating;
  if (rating !== null && typeof rating !== "number") {
    fail("expected a collection rating to be a number or null");
  }
  if (typeof value.rating_count !== "number") {
    fail("expected a collection rating count");
  }
  if (typeof value.puzzle_count !== "number") {
    fail("expected a collection puzzle count");
  }
  return {
    id: value.id,
    name: value.name,
    owner: { username: owner.username },
    rating,
    rating_count: value.rating_count,
    puzzle_count: value.puzzle_count,
  };
}

function parseRecommendedCollectionIds(raw: string | undefined): number[] {
  if (raw === undefined) return [];
  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function createCollectionsApi(
  options: CollectionsApiOptions = {},
): CollectionsApi {
  const baseUrl =
    options.baseUrl ??
    import.meta.env.VITE_OGS_API_BASE_URL ??
    "https://online-go.com/api/v1";
  const doFetch = options.fetchImpl ?? fetch.bind(globalThis);
  const recommendedIds =
    options.recommendedCollectionIds ??
    parseRecommendedCollectionIds(
      import.meta.env.VITE_OGS_RECOMMENDED_COLLECTION_IDS,
    );

  const fetchCollection = async (id: number): Promise<CollectionEntry> => {
    const response = await doFetch(`${baseUrl}/puzzles/collections/${id}`);
    if (!response.ok) {
      throw await responseError(response, `Failed to load collection ${id}`);
    }
    return validateCollectionEntry(await json(response));
  };

  return {
    async fetchCollectionPage(
      query: string,
      page: number,
      ordering: string = "-rating",
      pageSize: number = 10,
    ): Promise<CollectionPage> {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ordering,
      });
      if (query !== "") params.set("name__icontains", query);
      const response = await doFetch(
        `${baseUrl}/puzzles/collections/?${params.toString()}`,
      );
      if (!response.ok) {
        throw await responseError(
          response,
          `Failed to load collections (page ${page})`,
        );
      }
      const body = (await json(response)) as {
        results?: unknown;
        count?: unknown;
      };
      if (!Array.isArray(body.results)) {
        fail("expected an array of collections");
      }
      if (typeof body.count !== "number") {
        fail("expected a collection count");
      }
      return {
        results: body.results.map(validateCollectionEntry),
        count: body.count,
      };
    },
    fetchCollection,
    async fetchPuzzlesOfCollection(collectionId: number): Promise<OgsPuzzle[]> {
      const response = await doFetch(
        `${baseUrl}/puzzles/collections/${collectionId}/puzzles`,
      );
      if (!response.ok) {
        throw await responseError(
          response,
          `Failed to load puzzles of collection ${collectionId}`,
        );
      }
      const body = (await json(response)) as unknown;
      if (!Array.isArray(body)) {
        fail("expected an array of puzzles");
      }
      return body as OgsPuzzle[];
    },
    async fetchRecommendedCollections(): Promise<CollectionEntry[]> {
      const settled = await Promise.allSettled(
        recommendedIds.map((id) => fetchCollection(id)),
      );
      return settled.flatMap((result, index) => {
        if (result.status === "fulfilled") return [result.value];
        console.warn(
          `failed to load recommended collection ${recommendedIds[index]}, dropping it:`,
          result.reason,
        );
        return [];
      });
    },
  };
}

export const collectionsApi = createCollectionsApi();

import { useEffect, useState } from "react";
import { Button, Link, Stack, Typography } from "@mui/material";
import { collectionsApi, type CollectionEntry } from "../../ogs/ogsApi";
import CollectionsTable, { PAGE_SIZE } from "./CollectionsTable";
import CollectionsSearchForm from "./CollectionsSearchForm";
import SgfUploadForm from "./SgfUploadForm";
import FormatInfoDialog from "./FormatInfoDialog";
import Section from "../../components/Section";

const ORDERING_FIELDS = ["name", "owner__username", "puzzle_count", "rating"];

export default function CollectionsBrowser({
  onSelect,
  onUpload,
}: {
  onSelect: (collection: CollectionEntry) => void;
  onUpload: (file: File) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("-rating");
  const [data, setData] = useState<{
    items: CollectionEntry[];
    count: number;
  }>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [recommended, setRecommended] = useState<CollectionEntry[]>();
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [formatInfoOpen, setFormatInfoOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRecommendedLoading(true);
    collectionsApi
      .fetchRecommendedCollections()
      .then((entries) => {
        if (cancelled) return;
        setRecommended(entries);
      })
      .finally(() => {
        if (!cancelled) setRecommendedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    collectionsApi
      .fetchCollectionPage(submittedQuery, page, ordering, PAGE_SIZE)
      .then((body) => {
        if (cancelled) return;
        setData({ items: body.results, count: body.count });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submittedQuery, page, ordering]);

  function onSubmit(): void {
    setSubmittedQuery(query.trim());
    setPage(1);
  }

  return (
    <Stack spacing={3}>
      <Section
        title={
          <>
            Pick from recommended collections from{" "}
            <Link
              href="https://online-go.com/puzzles"
              target="_blank"
              rel="noopener noreferrer"
            >
              online-go.com
            </Link>
            ...
          </>
        }
      >
        <CollectionsTable
          entries={recommended ?? []}
          onSelect={onSelect}
          paginate={false}
          progressPending={recommendedLoading}
        />
      </Section>
      <Section
        title="...or upload an SGF file..."
        action={
          <Button
            variant="outlined"
            size="small"
            onClick={() => setFormatInfoOpen(true)}
          >
            Format info
          </Button>
        }
      >
        <SgfUploadForm onUpload={onUpload} />
        <FormatInfoDialog
          open={formatInfoOpen}
          onClose={() => setFormatInfoOpen(false)}
        />
      </Section>
      <Section title="...or search OGS">
        <CollectionsSearchForm
          query={query}
          onQueryChange={setQuery}
          onSubmit={onSubmit}
        />
        {error !== undefined && <Typography color="error">{error}</Typography>}
        <CollectionsTable
          keyHint={submittedQuery}
          entries={data?.items ?? []}
          onSelect={onSelect}
          paginate
          progressPending={loading}
          totalRows={data?.count}
          pageNumber={page - 1}
          onChangePage={(newPage) => setPage(newPage + 1)}
          sortColumn={ORDERING_FIELDS.indexOf(ordering.replace(/^-/, ""))}
          sortDescending={ordering.startsWith("-")}
          onSort={(index) => {
            const field = ORDERING_FIELDS[index];
            if (field === undefined) return;
            if ("-" + field === ordering) {
              setOrdering(field);
            } else {
              setOrdering("-" + field);
            }
            setPage(1);
          }}
        />
      </Section>
    </Stack>
  );
}

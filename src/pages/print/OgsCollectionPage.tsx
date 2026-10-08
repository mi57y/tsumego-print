import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Navigate, useNavigate, useParams } from "react-router";
import CollectionPreview from "./CollectionPreview";
import { collectionsApi } from "../../ogs/ogsApi";
import { puzzlesFromOgsResponse } from "../../ogs/ogsToPuzzles";
import { ogsCollectionPath, SELECT_COLLECTION_PATH } from "../../app/routes";
import { usePrintSession } from "../../app/PrintSession";
import Page from "../../components/Page";

export default function OgsCollectionPage() {
  const { id } = useParams();
  const collectionId = Number(id);
  const isValidId = Number.isInteger(collectionId) && collectionId > 0;
  const path = ogsCollectionPath(collectionId);
  const navigate = useNavigate();
  const { collection, setCollection } = usePrintSession();
  const [error, setError] = useState<string>();
  const loaded = collection?.path === path ? collection : undefined;

  useEffect(() => {
    if (!isValidId || collection?.path === path) return;
    let cancelled = false;
    setError(undefined);
    Promise.all([
      collectionsApi.fetchCollection(collectionId),
      collectionsApi.fetchPuzzlesOfCollection(collectionId),
    ])
      .then(([entry, list]) => {
        if (cancelled) return;
        const { puzzles, failed } = puzzlesFromOgsResponse(list);
        setCollection({ path, name: entry.name, puzzles, failed });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!isValidId) return <Navigate to={SELECT_COLLECTION_PATH} replace />;

  return (
    <Page>
      <title>
        {loaded !== undefined
          ? `Tsumego Print - ${loaded.name}`
          : error === undefined
            ? "Tsumego Print - Loading collection"
            : "Tsumego Print"}
      </title>
      <Stack spacing={3} sx={{ flexGrow: 1 }}>
        {error !== undefined && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate(SELECT_COLLECTION_PATH)}
              >
                Choose another collection
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        {loaded !== undefined ? (
          <CollectionPreview collection={loaded} />
        ) : (
          error === undefined && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CircularProgress size={20} />
              <Typography>Loading...</Typography>
            </Stack>
          )
        )}
      </Stack>
    </Page>
  );
}

import { Navigate } from "react-router";
import CollectionPreview from "./CollectionPreview";
import {
  SELECT_COLLECTION_PATH,
  UPLOADED_COLLECTION_PATH,
} from "../../app/routes";
import { usePrintSession } from "../../app/PrintSession";
import Page from "../../components/Page";

export default function UploadedCollectionPage() {
  const { collection } = usePrintSession();
  const loaded =
    collection?.path === UPLOADED_COLLECTION_PATH ? collection : undefined;

  if (loaded === undefined) {
    return <Navigate to={SELECT_COLLECTION_PATH} replace />;
  }

  return (
    <Page>
      <title>Tsumego Print - uploaded collection</title>
      <CollectionPreview collection={loaded} />
    </Page>
  );
}

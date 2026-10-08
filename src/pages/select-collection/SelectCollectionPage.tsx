import { useNavigate } from "react-router";
import CollectionsBrowser from "./CollectionsBrowser";
import { puzzlesFromSgf } from "../../puzzle/sgfToPuzzles";
import { ogsCollectionPath, UPLOADED_COLLECTION_PATH } from "../../app/routes";
import { usePrintSession } from "../../app/PrintSession";
import Page from "../../components/Page";

export default function SelectCollectionPage() {
  const navigate = useNavigate();
  const { setCollection } = usePrintSession();

  async function onUpload(file: File): Promise<void> {
    const { puzzles, failed } = puzzlesFromSgf(await file.text());
    setCollection({
      path: UPLOADED_COLLECTION_PATH,
      name: file.name.replace(/\.sgf$/i, ""),
      puzzles,
      failed,
    });
    navigate(UPLOADED_COLLECTION_PATH);
  }

  return (
    <Page>
      <title>Tsumego Print</title>
      <CollectionsBrowser
        onSelect={(collection) => navigate(ogsCollectionPath(collection.id))}
        onUpload={onUpload}
      />
    </Page>
  );
}

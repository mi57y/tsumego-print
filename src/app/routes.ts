export const LANDING_PATH = "/";
export const SELECT_COLLECTION_PATH = "/select-collection";
export const UPLOADED_COLLECTION_PATH = "/collections/uploaded-sgf";

export function ogsCollectionPath(id: number): string {
  return `/collections/ogs/${id}`;
}

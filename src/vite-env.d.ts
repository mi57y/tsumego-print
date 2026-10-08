interface ImportMetaEnv {
  readonly VITE_OGS_API_BASE_URL?: string;
  readonly VITE_OGS_RECOMMENDED_COLLECTION_IDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

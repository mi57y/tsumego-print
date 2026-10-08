import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "./AppLayout";
import LandingPage from "../pages/landing/LandingPage";
import OgsCollectionPage from "../pages/print/OgsCollectionPage";
import SelectCollectionPage from "../pages/select-collection/SelectCollectionPage";
import UploadedCollectionPage from "../pages/print/UploadedCollectionPage";
import {
  LANDING_PATH,
  SELECT_COLLECTION_PATH,
  UPLOADED_COLLECTION_PATH,
} from "./routes";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: LANDING_PATH, element: <LandingPage /> },
      { path: SELECT_COLLECTION_PATH, element: <SelectCollectionPage /> },
      { path: "/collections/ogs/:id", element: <OgsCollectionPage /> },
      { path: UPLOADED_COLLECTION_PATH, element: <UploadedCollectionPage /> },
      { path: "*", element: <Navigate to={LANDING_PATH} replace /> },
    ],
  },
]);

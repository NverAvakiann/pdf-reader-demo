import { createRoot } from "react-dom/client";
import "@fontsource-variable/public-sans";
import "@fontsource-variable/source-serif-4";
import "pdfjs-dist/web/pdf_viewer.css";
import "./styles.css";
import { App } from "./app";
import { RouterProvider } from "./lib/router";

createRoot(document.getElementById("root")!).render(
  <RouterProvider>
    <App />
  </RouterProvider>,
);

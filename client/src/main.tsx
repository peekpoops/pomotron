import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://394f8038acaffef6b0d78b852808f0fb6c456992068070208.ingest.de.sentry.io/4509820702752848",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>} showDialog>
    <App />
  </Sentry.ErrorBoundary>
);

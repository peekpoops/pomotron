import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from 'posthog-js/react';
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://394f8038acaffef6b0d78b852808f0fb@o4509820680798208.ingest.de.sentry.io/4509820702752848",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    // Send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
});

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <Sentry.ErrorBoundary fallback={<div>Something went wrong</div>} showDialog>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <App />
    </PostHogProvider>
  </Sentry.ErrorBoundary>
);

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const enabled = process.env.SENTRY_ENABLED === "true" && Boolean(dsn);

function shouldDropDuplicateServerFetchError(event: Sentry.ErrorEvent) {
  const exception = event.exception?.values?.[0];
  const type = exception?.type;
  const value = exception?.value;

  const isCustomServerFetchError =
    typeof event.message === "string" &&
    event.message.startsWith("SSR serverFetch failed:");
  const hasServerFetchTag = event.tags?.fetch_layer === "server";

  if (isCustomServerFetchError || hasServerFetchTag) {
    return false;
  }

  return type === "TypeError" && value === "fetch failed";
}

Sentry.init({
  dsn,
  enabled,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  beforeSend(event) {
    if (shouldDropDuplicateServerFetchError(event)) {
      return null;
    }

    return event;
  },
});

import { ConvexClient } from "convex/browser";
import { defineNitroPlugin } from "#imports";

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();
  const convexUrl = config.public.convexUrl;

  if (!convexUrl) {
    console.warn("NUXT_PUBLIC_CONVEX_URL is missing");
    return;
  }

  // Create the Convex client
  const client = new ConvexClient(convexUrl);

  // Add the Convex client to the event context
  nitroApp.hooks.hook("request", (event) => {
    event.context.$convex = client;
  });
});

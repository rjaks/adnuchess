import { ConvexClient } from "convex/browser";

export default defineNuxtPlugin(() => {
  const url = useRuntimeConfig().public.convexUrl;
  if (!url) {
    console.warn("NUXT_PUBLIC_CONVEX_URL is missing");
    return;
  }
  const client = new ConvexClient(url as string); // 👈 assert type
  return { provide: { convex: client } };
});

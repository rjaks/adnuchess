import { ConvexClient } from "convex/browser";
import { api } from "~/convex/_generated/api";

export default defineNuxtPlugin(() => {
  const url = useRuntimeConfig().public.convexUrl;
  if (!url) {
    console.warn("NUXT_PUBLIC_CONVEX_URL is missing");
    return;
  }
  const client = new ConvexClient(url as string);
  
  // Helper functions for typed API access
  const enhancedClient = {
    // Original client
    ...client,
    
    // Typed query
    async query(queryFunction: any, args: any) {
      return await client.query(queryFunction, args);
    },
    
    // Typed mutation
    async mutation(mutationFunction: any, args: any) {
      return await client.mutation(mutationFunction, args);
    },
    
    // Typed subscription
    onUpdate(queryFunction: any, args: any, callback: (result: any) => void) {
      return client.onUpdate(queryFunction, args, callback);
    }
  };
  
  return { provide: { convex: enhancedClient } };
});

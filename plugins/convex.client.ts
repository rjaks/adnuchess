import { ConvexClient } from "convex/browser";

const MISSING_FUNCTION_MESSAGE = "Could not find public function";

function isMissingFunctionError(error: unknown): boolean {
  const message =
    typeof error === "string"
      ? error
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : "";
  return message.includes(MISSING_FUNCTION_MESSAGE);
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const primaryUrl = runtimeConfig.public.convexUrl as string | undefined;
  const shouldUseFallback = import.meta.dev;
  const fallbackUrl = shouldUseFallback
    ? runtimeConfig.public.convexFallbackUrl || "https://localhost:3210"
    : undefined;

  const clients: { primary: ConvexClient | null; fallback: ConvexClient | null } = {
    primary: primaryUrl ? new ConvexClient(primaryUrl) : null,
    fallback: null,
  };

  const ensureFallbackClient = () => {
    if (!fallbackUrl) {
      return null;
    }
    if (!clients.fallback) {
      console.warn(
        `[Convex] Falling back to local Convex dev server at ${fallbackUrl}. ` +
          `If your browser blocks the self-signed certificate, accept it so WebSockets can connect.`,
      );
      clients.fallback = new ConvexClient(fallbackUrl);
    }
    return clients.fallback;
  };

  const runWithFallback = async <T>(
    executor: (client: ConvexClient) => Promise<T>,
  ): Promise<T> => {
    if (clients.primary) {
      try {
        return await executor(clients.primary);
      } catch (error) {
        if (!isMissingFunctionError(error)) {
          throw error;
        }
        const fallbackClient = ensureFallbackClient();
        if (!fallbackClient) {
          throw error;
        }
        return await executor(fallbackClient);
      }
    }

    const fallbackClient = ensureFallbackClient();
    if (!fallbackClient) {
      throw new Error(
        "Convex URL is not configured. Set NUXT_PUBLIC_CONVEX_URL or run the Convex dev server.",
      );
    }
    return await executor(fallbackClient);
  };

  if (!clients.primary && !fallbackUrl) {
    console.warn("NUXT_PUBLIC_CONVEX_URL is missing and no fallback is available");
    return;
  }

  const enhancedClient = {
    async query(queryFunction: any, args: any) {
      return await runWithFallback((client) => client.query(queryFunction, args));
    },
    async mutation(mutationFunction: any, args: any) {
      return await runWithFallback((client) => client.mutation(mutationFunction, args));
    },
    async action(actionFunction: any, args: any) {
      return await runWithFallback((client) => client.action(actionFunction, args));
    },
    onUpdate(queryFunction: any, args: any, callback: (result: any) => void) {
      const attempt = (client: ConvexClient) => client.onUpdate(queryFunction, args, callback);
      if (clients.primary) {
        try {
          return attempt(clients.primary);
        } catch (error) {
          if (!isMissingFunctionError(error)) {
            throw error;
          }
          const fallbackClient = ensureFallbackClient();
          if (!fallbackClient) {
            throw error;
          }
          return attempt(fallbackClient);
        }
      }

      const fallbackClient = ensureFallbackClient();
      if (!fallbackClient) {
        throw new Error(
          "Convex URL is not configured. Set NUXT_PUBLIC_CONVEX_URL or run the Convex dev server.",
        );
      }
      return attempt(fallbackClient);
    },
    close() {
      clients.primary?.close();
      clients.fallback?.close();
    },
    get raw() {
      return clients.primary ?? clients.fallback ?? null;
    },
  };

  return { provide: { convex: enhancedClient } };
});

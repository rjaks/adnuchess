import { navigateTo } from "#imports";
import { useAuth } from "~/composables/useAuth";
import { api } from "../convex/_generated/api"; // <- relative path

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ["/welcome", "/login", "/profile-setup"];
  if (publicPaths.includes(to.path) || to.path.startsWith("/api/")) return;

  // Only run on client; Convex client is browser-only
  if (import.meta.server) return;

  const auth = useAuth();
  if (!auth.user.value) await auth.refresh();
  const user = auth.user.value;
  if (!user) return navigateTo("/welcome");

  const { $convex } = useNuxtApp();

  await $convex.mutation(api.profiles.upsertFromSession, {
    userId: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });

  const profile = await $convex.query(api.profiles.getByUserId, {
    userId: user.id,
  });

  if (!profile?.role && to.path !== "/profile-setup") {
    return navigateTo("/profile-setup");
  }
});

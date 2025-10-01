import { navigateTo } from "#imports";
import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(async (to) => {
  const publicPaths = ["/welcome", "/login", "/profile-setup"];
  if (publicPaths.includes(to.path) || to.path.startsWith("/api/")) return;

  const auth = useAuth();
  if (!auth.user.value) await auth.refresh();
  const user = auth.user.value;
  if (!user) return navigateTo("/welcome");

  const { $convex } = useNuxtApp();

  await $convex.mutation("profiles:upsertFromSession", {
    userId: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });

  const profile = await $convex.query("profiles:getByUserId", { userId: user.id });
  if (!profile?.role) return navigateTo("/profile-setup");
});

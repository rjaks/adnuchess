import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsertFromSession = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        picture: args.picture ?? existing.picture,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("profiles", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      role: undefined, // force profile completion
      elo: 1200,
      picture: args.picture,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const completeProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    role: v.union(v.literal("student"), v.literal("faculty"), v.literal("alumni")),
  },
  handler: async (ctx, { userId, name, role }) => {
    const doc = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!doc) throw new Error("Profile not found; run upsertFromSession first.");

    await ctx.db.patch(doc._id, {
      name,
      role,
      updatedAt: Date.now(),
    });
  },
});

export const seedTestProfiles = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = [
      { userId: "u_demo_1", email: "s1@gbox.adnu.edu.ph", name: "Demo Student", role: "student" as const, elo: 1200 },
      { userId: "u_demo_2", email: "f1@gbox.adnu.edu.ph", name: "Demo Faculty", role: "faculty" as const, elo: 1300 },
      { userId: "u_demo_3", email: "a1@gbox.adnu.edu.ph", name: "Demo Alumni",  role: "alumni"  as const, elo: 1100 },
    ];
    for (const r of rows) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", r.userId))
        .unique();
      if (!existing) {
        await ctx.db.insert("profiles", { ...r, picture: undefined, createdAt: now, updatedAt: now });
      }
    }
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Set admin status for a user (one-time setup)
export const setAdminStatus = mutation({
  args: {
    email: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found for email: " + args.email);
    }
    
    await ctx.db.patch(profile._id, {
      isAdmin: args.isAdmin,
      updatedAt: Date.now(),
    });
    
    return { success: true, profileId: profile._id };
  },
});

// Check if current user is admin
export const checkAdminStatus = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    return {
      isAdmin: profile?.isAdmin || false,
      email: profile?.email || null,
    };
  },
});
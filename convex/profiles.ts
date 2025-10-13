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

export const updateDisplayName = mutation({
  args: {
    userId: v.string(),
    displayName: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { userId, displayName }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    // If displayName is null or empty string, remove the displayName field
    const updateData = {
      displayName: displayName && displayName.trim() !== "" ? displayName.trim() : undefined,
      updatedAt: Date.now(),
    };

    await ctx.db.patch(profile._id, updateData);
    return { success: true };
  },
});

export const updateDepartment = mutation({
  args: {
    userId: v.string(),
    department: v.union(v.string(), v.null()),
    skipCooldownCheck: v.optional(v.boolean()), // For admin override if needed
  },
  handler: async (ctx, { userId, department, skipCooldownCheck = false }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    
    // Check if user is trying to change to a different department
    const normalizedNewDept = department && department.trim() !== "" ? department.trim() : undefined;
    const isDepartmentChanging = profile.department !== normalizedNewDept;
    
    // Check cooldown period if department is actually changing
    if (isDepartmentChanging && !skipCooldownCheck && profile.departmentLastChanged) {
      const timeSinceLastChange = now - profile.departmentLastChanged;
      const remainingCooldown = oneYearInMs - timeSinceLastChange;
      
      if (remainingCooldown > 0) {
        // Calculate remaining days for user-friendly error
        const remainingDays = Math.ceil(remainingCooldown / (24 * 60 * 60 * 1000));
        throw new Error(`Department can only be changed once per year. You can change your department again in ${remainingDays} days.`);
      }
    }

    // Prepare update data
    const updateData: any = {
      department: normalizedNewDept,
      updatedAt: now,
    };

    // Only update departmentLastChanged if department is actually changing
    if (isDepartmentChanging) {
      updateData.departmentLastChanged = now;
    }

    await ctx.db.patch(profile._id, updateData);
    return { 
      success: true,
      departmentChanged: isDepartmentChanging,
      nextChangeAvailable: isDepartmentChanging ? now + oneYearInMs : (profile.departmentLastChanged || 0) + oneYearInMs
    };
  },
});

export const checkDepartmentCooldown = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    if (!profile.departmentLastChanged) {
      return { 
        canChange: true,
        remainingDays: 0,
        nextChangeDate: null
      };
    }

    const timeSinceLastChange = now - profile.departmentLastChanged;
    const remainingCooldown = oneYearInMs - timeSinceLastChange;
    
    if (remainingCooldown <= 0) {
      return { 
        canChange: true,
        remainingDays: 0,
        nextChangeDate: null
      };
    }

    const remainingDays = Math.ceil(remainingCooldown / (24 * 60 * 60 * 1000));
    const nextChangeDate = new Date(profile.departmentLastChanged + oneYearInMs);
    
    return { 
      canChange: false,
      remainingDays,
      nextChangeDate: nextChangeDate.toLocaleDateString()
    };
  },
});

export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    // Get all profiles and sort by ELO rating in descending order
    const profiles = await ctx.db.query("profiles").collect();
    return profiles.sort((a, b) => b.elo - a.elo);
  },
});

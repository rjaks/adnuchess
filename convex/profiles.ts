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
    
    // Use a retry mechanism with exponential backoff for write conflicts
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const existing = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .unique();

        if (existing) {
          // Only update if data has actually changed to reduce conflicts
          const needsUpdate = 
            existing.name !== args.name ||
            (args.picture && existing.picture !== args.picture);
            
          if (needsUpdate) {
            await ctx.db.patch(existing._id, {
              name: args.name,
              picture: args.picture ?? existing.picture,
              updatedAt: now,
            });
          }
          return existing._id;
        }

        // For new profiles, use a unique constraint approach
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
        
      } catch (error: any) {
        // Check if this is a write conflict
        if (error?.message?.includes('write conflict') || error?.message?.includes('Write conflicts')) {
          retryCount++;
          if (retryCount >= maxRetries) {
            console.error(`Profile upsert failed after ${maxRetries} retries for user ${args.userId}:`, error);
            throw new Error(`Profile creation failed due to conflicts. Please try again.`);
          }
          
          // Exponential backoff: wait 100ms, 200ms, 400ms
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)));
          continue;
        }
        
        // If it's not a write conflict, re-throw immediately
        throw error;
      }
    }
    
    throw new Error('Unexpected error in profile upsert');
  },
});

// Safer profile creation for initial registration - handles conflicts gracefully
export const createInitialProfile = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // First, check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      // Profile already exists, just return it
      return { _id: existing._id, created: false };
    }

    try {
      // Attempt to create new profile
      const profileId = await ctx.db.insert("profiles", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        role: undefined, // force profile completion
        elo: 1200,
        picture: args.picture,
        createdAt: now,
        updatedAt: now,
      });
      
      return { _id: profileId, created: true };
      
    } catch (error: any) {
      // If insertion fails due to race condition, try to find the profile again
      if (error?.message?.includes('write conflict') || error?.message?.includes('duplicate')) {
        const retryProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .unique();
          
        if (retryProfile) {
          return { _id: retryProfile._id, created: false };
        }
      }
      
      throw error;
    }
  },
});

export const completeProfile = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    role: v.union(v.literal("student"), v.literal("faculty"), v.literal("alumni")),
    department: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, role, department }) => {
    const doc = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!doc) throw new Error("Profile not found; run upsertFromSession first.");

    await ctx.db.patch(doc._id, {
      name,
      role,
      department: department && department.trim() !== "" ? department.trim() : undefined,
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

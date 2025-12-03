import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Simple test query
export const testQuery = query({
  args: {},
  handler: async () => {
    console.log('Test query called')
    return { success: true, message: "Query works!" }
  },
})

// Simple test mutation
export const testMutation = mutation({
  args: {
    testMessage: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('Test mutation called with:', args)
    return { success: true, received: args.testMessage }
  },
})

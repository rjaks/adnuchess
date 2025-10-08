import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    displayName: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("student"), v.literal("faculty"), v.literal("alumni"))
    ),
    elo: v.number(),
    picture: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  games: defineTable({
    gameId: v.string(),
    fen: v.string(),
    lastMove: v.optional(v.string()),
    lastMoveTime: v.number(),
    currentTurn: v.union(v.literal("white"), v.literal("black")),
    player1: v.object({
      id: v.string(),
      name: v.string(),
      color: v.union(v.literal("white"), v.literal("black"))
    }),
    player2: v.object({
      id: v.string(),
      name: v.string(),
      color: v.union(v.literal("white"), v.literal("black"))
    }),
    status: v.union(v.literal("waiting"), v.literal("active"), v.literal("finished")),
    winner: v.optional(v.string()),
    endReason: v.optional(v.string()),
    drawOffer: v.optional(v.object({
      offeredBy: v.string(),
      offeredTo: v.string(),
      offeredAt: v.number()
    })),
    gameMode: v.string(),
    createdAt: v.number(),
    moveHistory: v.array(v.string()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_player", ["player1.id"])
    .index("by_player2", ["player2.id"])
    .index("by_status", ["status"]),
});
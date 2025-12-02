import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Get all messages for a game
export const getMessages = query({
  args: { gameId: v.string() },
  handler: async (ctx, args) => {
    console.log('getMessages called for gameId:', args.gameId)
    
    try {
      const messages = await ctx.db
        .query("chat_messages")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .collect()
      
      console.log(`Found ${messages.length} messages`)
      
      // Sort by timestamp (oldest first)
      return messages.sort((a, b) => a.timestamp - b.timestamp)
    } catch (error) {
      console.error('Error in getMessages:', error)
      throw error
    }
  },
})

// Send a chat message
export const sendMessage = mutation({
  args: {
    gameId: v.string(),
    userId: v.string(),
    userName: v.string(),
    message: v.string(),
  },  handler: async (ctx, args) => {
    console.log('=== sendMessage START ===')
    console.log('Args received:', JSON.stringify(args, null, 2))
    
    // Validate message length
    if (args.message.length > 500) {
      console.error('Message too long:', args.message.length)
      throw new Error("Message too long")
    }
    
    if (!args.message.trim()) {
      console.error('Message is empty')
      throw new Error("Message cannot be empty")
    }
    
    console.log('Validation passed, attempting to insert...')
    
    const messageData = {
      gameId: args.gameId,
      userId: args.userId,
      userName: args.userName,
      message: args.message.trim(),
      timestamp: Date.now(),
    }
    
    console.log('Message data to insert:', JSON.stringify(messageData, null, 2))
    
    try {
      // Create the message
      const messageId = await ctx.db.insert("chat_messages", messageData)
      
      console.log('Message inserted successfully with ID:', messageId)
      console.log('=== sendMessage END (SUCCESS) ===')
      return { success: true, messageId }
    } catch (error) {
      console.error('=== sendMessage END (ERROR) ===')
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error?.message)
      console.error('Full error:', error)
      throw error
    }
  },
})

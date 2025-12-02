<template>
  <div class="rounded-3xl border border-white/70 bg-gradient-to-br from-amber-50 to-blue-50 p-4 shadow-inner">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h4 class="text-sm font-semibold text-[#021d94]">Chat</h4>
        <span
          v-if="!showChat && unreadMessages > 0"
          class="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
        >
          {{ unreadMessages > 9 ? '9+' : unreadMessages }}
        </span>
      </div>
      <button
        @click="$emit('toggle-chat')"
        class="text-xs font-medium text-[#021d94] hover:text-[#021d94]/80 transition"
      >
        {{ showChat ? 'Hide' : 'Show' }}
      </button>
    </div>
    
    <div v-if="showChat" class="space-y-3">
      <!-- Chat messages -->
      <div
        ref="chatContainer"
        class="h-40 overflow-y-auto bg-white/60 rounded-lg p-3 space-y-2"
      >
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[
            'text-sm p-2 rounded-lg',
            msg.userId === currentUserId
              ? 'bg-[#021d94] text-white ml-auto max-w-[80%]'
              : 'bg-white/80 text-slate-900 mr-auto max-w-[80%]'
          ]"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="font-semibold text-xs opacity-80">
              {{ msg.userName }}
            </div>
            <div class="text-xs opacity-60">
              {{ formatMessageTime(msg.timestamp) }}
            </div>
          </div>
          <div class="break-words">{{ msg.message }}</div>
        </div>
        
        <div v-if="messages.length === 0" class="text-center text-slate-500 text-xs py-4">
          No messages yet. Say hi! 👋
        </div>
      </div>
      
      <!-- Chat input -->
      <div class="space-y-2">
        <div class="flex gap-2">
          <input
            v-model="chatInput"
            @keyup.enter="sendMessage"
            type="text"
            placeholder="Type a message..."
            maxlength="500"
            class="flex-1 rounded-lg px-3 py-2 text-sm border border-slate-300 focus:border-[#021d94] focus:ring-1 focus:ring-[#021d94] outline-none"
          />
          <button
            @click="sendMessage"
            :disabled="!chatInput.trim()"
            class="rounded-lg bg-[#021d94] px-4 py-2 text-sm font-semibold text-white hover:bg-[#021d94]/90 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div class="text-xs text-slate-500 text-right">
          {{ chatInput.length }}/500
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'

type ChatMessage = {
  userId: string
  userName: string
  message: string
  timestamp: number
}

interface Props {
  messages: ChatMessage[]
  showChat: boolean
  unreadMessages: number
  currentUserId?: string
}

interface Emits {
  (e: 'toggle-chat'): void
  (e: 'send-message', message: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  emit('send-message', chatInput.value.trim())
  chatInput.value = ''
}

// Auto-scroll to bottom when messages change
watch(() => props.messages, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}, { deep: true })

// Scroll to bottom when chat is opened
watch(() => props.showChat, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
})
</script>

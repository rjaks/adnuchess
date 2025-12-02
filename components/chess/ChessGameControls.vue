<template>
  <div class="rounded-3xl border border-white/70 bg-gradient-to-br from-amber-50 to-blue-50 p-4 shadow-inner">
    <h4 class="text-sm font-semibold text-[#021d94] mb-3">Actions</h4>
    <div class="flex gap-2">
      <button
        @click="$emit('offer-draw')"
        class="flex-1 rounded-lg bg-[#021d94] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#021d94]/90 transition shadow-md"
        :disabled="drawOffered && !drawOfferInbound"
      >
        {{ drawButtonText }}
      </button>
      <button
        @click="$emit('resign')"
        class="flex-1 rounded-lg bg-[#021d94] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#021d94]/90 transition shadow-md"
      >
        Resign
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  drawOffered: boolean
  drawOfferInbound: boolean
}

interface Emits {
  (e: 'offer-draw'): void
  (e: 'resign'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const drawButtonText = computed(() => {
  if (props.drawOfferInbound) return 'Accept Draw'
  return props.drawOffered ? 'Draw Offered' : 'Offer Draw'
})
</script>

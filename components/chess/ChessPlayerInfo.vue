<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="h-10 w-10 rounded-full bg-[#021d94]/10 flex items-center justify-center">
        <span class="text-sm font-bold text-[#021d94]">{{ initials }}</span>
      </div>
      <div>
        <p class="font-semibold text-slate-900">{{ player?.name || 'Opponent' }}</p>
        <p class="text-xs text-slate-500">{{ player?.color === 'white' ? 'White' : 'Black' }}</p>
      </div>
    </div>
    <div class="text-right">
      <slot name="extra-info"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Player = {
  id: string
  name: string
  color: 'white' | 'black'
}

interface Props {
  player: Player | null
}

const props = defineProps<Props>()

const initials = computed(() => {
  if (!props.player) return 'OP'
  return props.player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})
</script>

<template>
  <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3">
    <div class="space-y-1">
      <p class="text-sm font-semibold text-slate-800">{{ label }}</p>
      <p class="text-xs text-slate-500">{{ detail }}</p>
    </div>
    <label class="relative inline-flex h-6 w-12 cursor-pointer items-center">
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="checked"
        @change="$emit('change', ($event.target as HTMLInputElement).checked)"
      />
      <span class="absolute inset-0 rounded-full bg-slate-300/70 transition peer-checked:bg-[#021d94]"></span>
      <span
        class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-6"
      ></span>
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  detail: string
  checked: boolean
}>()

defineEmits<{
  (e: 'change', value: boolean): void
}>()
</script>

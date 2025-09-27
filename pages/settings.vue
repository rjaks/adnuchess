<template>
  <div class="mx-auto max-w-4xl px-4 py-16 space-y-12">
    <header class="space-y-3 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Preferences</p>
      <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Tune your arena.</h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
        Update how the experience looks, sounds, and connects with other Ateneans. These controls will expand as new
        features roll out.
      </p>
    </header>

    <section class="space-y-10">
      <article
        v-for="section in settingsSections"
        :key="section.title"
        class="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-glass backdrop-blur"
      >
        <header class="mb-6 text-left">
          <h2 class="text-2xl font-semibold text-slate-900">{{ section.title }}</h2>
          <p class="mt-1 text-sm text-slate-600">{{ section.description }}</p>
        </header>

        <div class="space-y-6">
          <div
            v-for="item in section.items"
            :key="item.key"
            class="flex flex-col gap-3 border-b border-slate-200/70 pb-6 last:border-b-0 last:pb-0 md:flex-row md:items-center md:justify-between"
          >
            <div class="space-y-1">
              <p class="text-sm font-semibold uppercase tracking-[0.2em] text-[#021d94]/80">{{ item.label }}</p>
              <p class="text-sm text-slate-600">{{ item.detail }}</p>
            </div>

            <div class="md:text-right">
              <div v-if="item.type === 'toggle'" class="flex items-center justify-end gap-3">
                <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {{ settings[item.key] ? 'On' : 'Off' }}
                </span>
                <button
                  type="button"
                  class="relative inline-flex h-6 w-12 items-center rounded-full transition"
                  :class="settings[item.key] ? 'bg-[#021d94]' : 'bg-slate-300/70'"
                  role="switch"
                  :aria-checked="settings[item.key]"
                  @click="toggleSetting(item.key)"
                >
                  <span
                    class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition"
                    :class="settings[item.key] ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>

              <div v-else-if="item.type === 'select'" class="flex flex-col gap-2 md:items-end md:text-right">
                <select
                  v-model="settings[item.key]"
                  class="rounded-full border border-[#021d94]/20 bg-white px-4 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition focus:border-[#021d94] focus:outline-none focus:ring-2 focus:ring-[#021d94]/30"
                >
                  <option v-for="option in item.options" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <p class="text-xs text-slate-500">Applies instantly to incoming invites.</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <footer class="rounded-3xl border border-[#021d94]/10 bg-[#021d94]/5 p-8 text-center shadow-glass backdrop-blur">
      <p class="text-base font-semibold text-[#021d94]">More controls are on the roadmap.</p>
      <p class="mt-2 text-sm text-slate-600">
        Looking for something specific? Contact us via our email
        <span class="font-semibold">adnuchess@gmail.com</span>.
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

type ToggleSettingKey = 'chatFilter' | 'gameSounds' | 'desktopNotifications'
type SelectSettingKey = 'challengePool'

type SettingsState = Record<ToggleSettingKey, boolean> & {
  challengePool: 'anyone' | 'friends' | 'invite-only'
}

type ToggleSettingItem = {
  type: 'toggle'
  key: ToggleSettingKey
  label: string
  detail: string
}

type SelectSettingItem = {
  type: 'select'
  key: SelectSettingKey
  label: string
  detail: string
  options: Array<{ value: SettingsState[SelectSettingKey]; label: string }>
}

type SettingsItem = ToggleSettingItem | SelectSettingItem

type SettingsSection = {
  title: string
  description: string
  items: SettingsItem[]
}

const settings = reactive<SettingsState>({
  chatFilter: true,
  gameSounds: true,
  desktopNotifications: false,
  challengePool: 'friends',
})

const settingsSections: SettingsSection[] = [
  {
    title: 'General preferences',
    description: 'Tune how the arena sounds and moderates as you play.',
    items: [
      {
        type: 'toggle',
        key: 'chatFilter',
        label: 'Guarded chat filter',
        detail: 'Hide flagged words and auto-moderate arena chat windows.',
      },
      {
        type: 'toggle',
        key: 'gameSounds',
        label: 'Board sounds',
        detail: 'Play move, capture, and timer sounds for live matches.',
      },
      {
        type: 'toggle',
        key: 'desktopNotifications',
        label: 'Desktop alerts',
        detail: 'Get notified when it’s your move or a challenge arrives.',
      },
    ],
  },
  {
    title: 'Matchmaking',
    description: 'Control how rivals reach you for friendly or rated games.',
    items: [
      {
        type: 'select',
        key: 'challengePool',
        label: 'Who can challenge me?',
        detail: 'Limit direct challenges to trusted rivals or open it to all verified players.',
        options: [
          { value: 'anyone', label: 'Anyone on campus' },
          { value: 'friends', label: 'Friends & clubmates' },
          { value: 'invite-only', label: 'Invite only' },
        ],
      },
    ],
  },
]

const toggleSetting = (key: ToggleSettingKey) => {
  settings[key] = !settings[key]
}
</script>

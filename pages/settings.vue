<template>
  <div class="mx-auto max-w-4xl px-4 py-12 space-y-10">
    <header class="space-y-2 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[#021d94]/70">Preferences</p>
      <h1 class="text-4xl font-bold text-slate-900 sm:text-5xl">Your arena settings</h1>
      <p class="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
        These switches actually save. We keep them in a first-party cookie so they persist across sessions.
      </p>
    </header>

    <section class="space-y-6">
      <article class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900">Play experience</h2>
          <p class="text-sm text-slate-600">Sound and on-board guidance.</p>
        </header>
        <div class="space-y-4">
          <SettingToggle
            label="Board sounds"
            detail="Play move and capture sounds."
            :checked="settings.moveSounds"
            @change="(val) => update('moveSounds', val)"
          />
          <SettingToggle
            label="Chat filter"
            detail="Hide flagged words in chat areas."
            :checked="settings.chatFilter"
            @change="(val) => update('chatFilter', val)"
          />
        </div>
      </article>

      <article class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900">Alerts</h2>
          <p class="text-sm text-slate-600">Control desktop notifications.</p>
        </header>
        <div class="space-y-4">
          <SettingToggle
            label="Desktop notifications"
            :detail="notificationDetail"
            :checked="settings.desktopNotifications && settings.notificationsPermission === 'granted'"
            @change="handleNotifications"
          />
          <p class="text-xs text-slate-500">
            Permission: <span class="font-semibold text-[#021d94]">{{ settings.notificationsPermission }}</span>
          </p>
        </div>
      </article>

      <article class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <header class="mb-4">
          <h2 class="text-xl font-semibold text-slate-900">Challenges</h2>
          <p class="text-sm text-slate-600">Who can send you invites.</p>
        </header>
        <div class="space-y-3">
          <label class="text-sm font-semibold text-slate-800">Challenge pool</label>
          <select
            v-model="selectedPool"
            class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#021d94] focus:outline-none focus:ring-2 focus:ring-[#021d94]/20"
          >
            <option v-for="option in poolOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <p class="text-xs text-slate-500">Saved instantly for future matchmaking prompts.</p>
        </div>
      </article>

      <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        <div>
          <p class="font-semibold text-slate-900">Saved locally</p>
          <p class="text-xs text-slate-500">Last updated: {{ new Date(settings.updatedAt).toLocaleString() }}</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-[#021d94]/30 bg-white px-4 py-2 text-sm font-semibold text-[#021d94] shadow-sm transition hover:border-[#021d94]/50 hover:bg-white"
          @click="resetDefaults"
        >
          Reset to defaults
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import SettingToggle from '~/components/SettingToggle.vue'
import { computed } from 'vue'
import { useUserSettings, type ChallengePool } from '~/composables/useUserSettings'

const { settings, updateSetting, requestNotifications } = useUserSettings()

const poolOptions: { value: ChallengePool; label: string }[] = [
  { value: 'anyone', label: 'Anyone on campus' },
  { value: 'friends', label: 'Friends & clubmates' },
  { value: 'invite-only', label: 'Invite only' },
]

const notificationDetail = computed(() =>
  settings.value.notificationsPermission === 'granted'
    ? 'Desktop alerts are enabled.'
    : 'We will ask your browser for permission.',
)

const selectedPool = computed({
  get: () => settings.value.challengePool,
  set: (val: ChallengePool) => updateSetting('challengePool', val),
})

const update = (key: keyof typeof settings.value, value: any) => {
  updateSetting(key as any, value as any)
}

const handleNotifications = async (val: boolean) => {
  if (!val) {
    updateSetting('desktopNotifications', false)
    return
  }
  const permission = await requestNotifications()
  if (permission !== 'granted') {
    updateSetting('desktopNotifications', false)
  }
}

const resetDefaults = () => {
  updateSetting('chatFilter', true)
  updateSetting('moveSounds', true)
  updateSetting('desktopNotifications', false)
  updateSetting('notificationsPermission', 'default')
  updateSetting('challengePool', 'friends')
}
</script>

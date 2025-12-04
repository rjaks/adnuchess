import { useCookie, useState, watch } from '#imports'

export type ChallengePool = 'anyone' | 'friends' | 'invite-only'

export type UserSettings = {
  chatFilter: boolean
  moveSounds: boolean
  desktopNotifications: boolean
  notificationsPermission: NotificationPermission | 'default'
  challengePool: ChallengePool
  updatedAt: string
}

const defaultSettings: UserSettings = {
  chatFilter: true,
  moveSounds: true,
  desktopNotifications: false,
  notificationsPermission: 'default',
  challengePool: 'friends',
  updatedAt: new Date().toISOString(),
}

export const useUserSettings = () => {
  const cookie = useCookie<UserSettings>('adnu-settings', {
    default: () => defaultSettings,
    sameSite: 'lax',
  })

  const settings = useState<UserSettings>('adnu-settings', () => cookie.value || defaultSettings)

  // Persist changes to cookie
  watch(
    settings,
    (val) => {
      cookie.value = { ...val, updatedAt: new Date().toISOString() }
    },
    { deep: true },
  )

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    settings.value = { ...settings.value, [key]: value }
  }

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      updateSetting('notificationsPermission', 'default')
      return 'default' as NotificationPermission
    }
    const permission = await Notification.requestPermission()
    updateSetting('notificationsPermission', permission)
    updateSetting('desktopNotifications', permission === 'granted')
    return permission
  }

  return { settings, updateSetting, requestNotifications }
}

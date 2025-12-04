import { onMounted, watch } from 'vue'
import { useCookie, useState } from '#imports'

export type ThemeMode = 'light' | 'dark'

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(mode)
}

export const useTheme = () => {
  const cookie = useCookie<ThemeMode>('adnu-theme', { default: () => 'light', sameSite: 'lax' })
  const theme = useState<ThemeMode>('adnu-theme', () => cookie.value || 'light')

  onMounted(() => {
    applyTheme(theme.value)
  })

  watch(
    theme,
    (mode) => {
      cookie.value = mode
      applyTheme(mode)
    },
    { immediate: true },
  )

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}

/** @typedef {'light' | 'dark' | 'system'} ThemeMode */

/**
 * @returns {'light' | 'dark'}
 */
function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Apply a theme mode for the current session. Does not persist.
 * @param {ThemeMode} mode
 */
export function applyTheme(mode) {
  const root = document.documentElement
  if (mode === 'system') {
    root.removeAttribute('data-theme')
    root.style.colorScheme = getSystemTheme()
    return
  }
  root.setAttribute('data-theme', mode)
  root.style.colorScheme = mode
}

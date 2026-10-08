import { useId, useState } from 'react'
import Menu, { MenuItem, MenuSeparator } from './Menu'

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="4" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}

export default function AppNav({
  themeMode,
  onThemeChange,
  onAbout,
  onCreate,
  guideVisible,
  onShowGuide,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnId = useId()

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="app-bar">
      <div className="app-bar-start">
        <button
          type="button"
          id={menuBtnId}
          className="icon-btn"
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MoreIcon />
        </button>

        <Menu open={menuOpen} onClose={closeMenu} labelledBy={menuBtnId}>
          <div className="menu-section-label" id={`${menuBtnId}-theme`}>
            Theme
          </div>
          <div
            className="menu-theme-row"
            role="group"
            aria-labelledby={`${menuBtnId}-theme`}
          >
            {(['system', 'light', 'dark']).map((mode) => (
              <button
                key={mode}
                type="button"
                className="menu-theme-btn"
                aria-pressed={themeMode === mode}
                onClick={() => onThemeChange(mode)}
              >
                {mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
          <MenuSeparator />
          {!guideVisible ? (
            <MenuItem
              onClick={() => {
                closeMenu()
                onShowGuide()
              }}
            >
              Show how-to guide
            </MenuItem>
          ) : null}
          <MenuItem
            onClick={() => {
              closeMenu()
              onAbout()
            }}
          >
            About
          </MenuItem>
        </Menu>
      </div>

      <h1 className="app-title">TODO BOARD</h1>

      <div className="app-bar-end">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreate}
        >
          Create
        </button>
      </div>
    </header>
  )
}

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export function ThemePanel() {
  const { theme, setThemeId, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className={`theme-panel${open ? ' open' : ''}`}>
      <button
        className="theme-toggle-btn"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Toggle theme panel"
        title="Themes"
      >
        ⚙
      </button>

      {open && (
        <div className="theme-drawer" role="menu" aria-label="Theme selection">
          <p className="theme-drawer-label">Theme</p>
          {themes.map(t => (
            <button
              key={t.id}
              className={`theme-swatch-btn${t.id === theme.id ? ' active' : ''}`}
              role="menuitemradio"
              aria-checked={t.id === theme.id}
              onClick={() => { setThemeId(t.id); setOpen(false); }}
              style={{ '--swatch': t.cssVars['--accent'] } as React.CSSProperties}
            >
              <span className="swatch-dot" />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

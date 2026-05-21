import React, { useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeSwitcher.css';

const THEME_PREVIEWS = {
  dark:     { bg: '#0d0f14', card: '#181c26', accent: '#6c63ff' },
  light:    { bg: '#f4f6fb', card: '#ffffff', accent: '#6c63ff' },
  midnight: { bg: '#060c1a', card: '#0f1a2e', accent: '#4f8ef7' },
  forest:   { bg: '#0a120e', card: '#122016', accent: '#22c55e' },
};

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="theme-wrapper">
      <button className="btn-ghost icon-btn" onClick={() => setOpen((o) => !o)} title="Change theme">
        <Palette size={18} />
      </button>

      {open && (
        <>
          <div className="theme-backdrop" onClick={() => setOpen(false)} />
          <div className="theme-panel card">
            <div className="theme-panel-header">
              <h3>Theme</h3>
              <button className="btn-ghost icon-btn" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <div className="theme-grid">
              {Object.entries(themes).map(([key, t]) => {
                const preview = THEME_PREVIEWS[key];
                return (
                  <button
                    key={key}
                    className={`theme-option ${theme === key ? 'active' : ''}`}
                    onClick={() => { setTheme(key); setOpen(false); }}
                  >
                    <div className="theme-preview" style={{ background: preview.bg }}>
                      <div className="theme-preview-card" style={{ background: preview.card }}>
                        <div className="theme-preview-bar" style={{ background: preview.accent }} />
                        <div className="theme-preview-line" style={{ background: preview.accent + '44' }} />
                        <div className="theme-preview-line short" style={{ background: preview.accent + '33' }} />
                      </div>
                    </div>
                    <div className="theme-name">{t.name}</div>
                    {theme === key && <div className="theme-check"><Check size={10} /></div>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

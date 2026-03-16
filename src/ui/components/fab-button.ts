import { ICON_MIC, ICON_STOP } from '../icons.js';
import type { SessionState } from '../../types/index.js';

export function createFab(accentColor: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'vaw-fab';
  btn.setAttribute('aria-label', 'Voice assistant');
  btn.style.background = accentColor;
  btn.innerHTML = ICON_MIC;
  return btn;
}

export function updateFab(btn: HTMLButtonElement, state: SessionState, accentColor: string): void {
  const isActive = state === 'active' || state === 'connecting';
  btn.innerHTML = isActive ? ICON_STOP : ICON_MIC;
  btn.classList.toggle('vaw-fab--active', state === 'active');
  btn.setAttribute('aria-label', isActive ? 'Stop voice assistant' : 'Start voice assistant');
  btn.style.background = isActive ? '#ef4444' : accentColor;
}

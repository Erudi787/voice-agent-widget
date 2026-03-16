import { ICON_CLOSE } from '../icons.js';
import { createTranscriptContainer } from './transcript.js';
import { createVisualizer } from './audio-visualizer.js';
import type { WidgetConfig } from '../../types/index.js';

export interface PanelElements {
  panel: HTMLDivElement;
  statusDot: HTMLSpanElement;
  statusText: HTMLSpanElement;
  transcript: HTMLDivElement;
  visualizer: HTMLDivElement;
  controls: HTMLDivElement;
  actionBtn: HTMLButtonElement;
  closeBtn: HTMLButtonElement;
}

export function createPanel(config: WidgetConfig): PanelElements {
  const panel = document.createElement('div');
  panel.className = `vaw-panel vaw-panel--${config.theme} vaw-panel--hidden`;

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'vaw-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'vaw-header__title';

  const statusDot = document.createElement('span');
  statusDot.className = 'vaw-status-dot vaw-status-dot--idle';

  const statusText = document.createElement('span');
  statusText.textContent = 'Voice Assistant';

  titleWrap.appendChild(statusDot);
  titleWrap.appendChild(statusText);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'vaw-header__close';
  closeBtn.setAttribute('aria-label', 'Close panel');
  closeBtn.innerHTML = ICON_CLOSE;

  header.appendChild(titleWrap);
  header.appendChild(closeBtn);

  // ── Transcript ──
  const transcript = createTranscriptContainer();

  // ── Visualizer ──
  const visualizer = createVisualizer(config.accentColor);

  // ── Controls ──
  const controls = document.createElement('div');
  controls.className = 'vaw-controls';

  const actionBtn = document.createElement('button');
  actionBtn.className = 'vaw-btn vaw-btn--start';
  actionBtn.style.background = config.accentColor;
  actionBtn.textContent = 'Start Conversation';

  controls.appendChild(actionBtn);

  // ── Assemble ──
  panel.appendChild(header);
  panel.appendChild(transcript);
  panel.appendChild(visualizer);
  panel.appendChild(controls);

  return { panel, statusDot, statusText, transcript, visualizer, controls, actionBtn, closeBtn };
}

import type { TranscriptEntry } from '../../types/index.js';

export function createTranscriptContainer(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'vaw-transcript';
  return el;
}

export function appendMessage(
  container: HTMLDivElement,
  entry: TranscriptEntry,
  accentColor: string,
): HTMLDivElement {
  const bubble = document.createElement('div');
  bubble.className = `vaw-message vaw-message--${entry.role}`;
  bubble.textContent = entry.text;

  if (entry.role === 'user') {
    bubble.style.background = accentColor;
    bubble.style.color = '#fff';
  }

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

export function updateLastMessage(
  container: HTMLDivElement,
  role: 'user' | 'assistant',
  text: string,
): boolean {
  const messages = container.querySelectorAll(`.vaw-message--${role}`);
  const last = messages[messages.length - 1] as HTMLDivElement | undefined;
  if (last) {
    last.textContent = text;
    container.scrollTop = container.scrollHeight;
    return true;
  }
  return false;
}

export function clearTranscript(container: HTMLDivElement): void {
  container.innerHTML = '';
}

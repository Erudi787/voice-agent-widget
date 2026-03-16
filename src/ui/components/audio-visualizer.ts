const BAR_COUNT = 24;

export function createVisualizer(accentColor: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'vaw-visualizer';

  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('div');
    bar.className = 'vaw-visualizer__bar';
    bar.style.background = accentColor;
    bar.style.height = '4px';
    el.appendChild(bar);
  }

  return el;
}

export function updateVisualizer(el: HTMLDivElement, volumeLevel: number): void {
  const bars = el.querySelectorAll<HTMLDivElement>('.vaw-visualizer__bar');
  const normalized = Math.min(1, Math.max(0, volumeLevel));

  bars.forEach((bar, i) => {
    // Create a wave-like pattern across bars
    const position = i / bars.length;
    const wave = Math.sin(position * Math.PI) * normalized;
    const height = Math.max(4, wave * 28);
    bar.style.height = `${height}px`;
  });
}

export function resetVisualizer(el: HTMLDivElement): void {
  const bars = el.querySelectorAll<HTMLDivElement>('.vaw-visualizer__bar');
  bars.forEach((bar) => {
    bar.style.height = '4px';
  });
}

export interface ChatInputElements {
  container: HTMLDivElement;
  input: HTMLInputElement;
  sendBtn: HTMLButtonElement;
}

const ICON_SEND = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`;

export function createChatInput(accentColor: string, onSend: (text: string) => void): ChatInputElements {
  const container = document.createElement('div');
  container.className = 'vaw-chat-input';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'vaw-chat-input__field';
  input.placeholder = 'Type a message…';
  input.setAttribute('aria-label', 'Chat message');

  const sendBtn = document.createElement('button');
  sendBtn.className = 'vaw-chat-input__send';
  sendBtn.setAttribute('aria-label', 'Send message');
  sendBtn.style.background = accentColor;
  sendBtn.innerHTML = ICON_SEND;
  sendBtn.disabled = true;

  const submit = () => {
    const text = input.value.trim();
    if (!text) return;
    onSend(text);
    input.value = '';
    sendBtn.disabled = true;
  };

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  });

  sendBtn.addEventListener('click', submit);

  container.appendChild(input);
  container.appendChild(sendBtn);

  return { container, input, sendBtn };
}

# 🎙️ Voice Agent Widget

An embeddable voice agent widget powered by Vapi.ai that can be dropped into any website with a single script tag. Users can interact with an AI voice assistant directly from the browser through real-time voice conversations with live transcription.

## 📦 Technologies

- `Vite`
- `TypeScript`
- `Vapi.ai Web SDK`
- `WebRTC`
- `Shadow DOM`
- `Custom Elements`
- `CSS`

## 🦄 Features

Here's what you can do with Voice Agent Widget:

- **Start a Voice Conversation**: Click the floating action button to begin talking with an AI voice assistant in real-time.

- **Live Transcription**: See what you and the assistant are saying as the conversation happens, with partial and final transcript updates.

- **Audio Visualizer**: A waveform visualizer reacts to the volume level during active conversations, giving visual feedback that the assistant is listening or speaking.

- **Expandable Panel**: The widget starts as a compact floating button. Click it to expand into a full conversation panel with transcript history, status indicators, and controls.

- **Session Lifecycle Management**: The widget tracks the full session state — idle, requesting microphone, connecting, active, ending, and error — with clear UI feedback at every stage.

- **Shadow DOM Isolation**: The widget renders inside a Shadow DOM, so its styles never clash with the host website's CSS.

- **Three Embedding Methods**: Embed via custom element, script tag with data attributes, or programmatic JavaScript API.

- **Chat Mode**: Type text messages alongside voice during an active conversation. Supports three modes: `voice` (mic only), `chat` (text only), or `both` (voice + text input).

- **Keyboard Shortcuts**: Escape to close the panel, Ctrl+Shift+V to toggle the panel. Focus-visible outlines for full keyboard navigation.

### 🎯 Widget States:

The widget communicates its state clearly:

- **Idle**: Ready to start — mic icon displayed.
- **Requesting Microphone**: Browser permission prompt is shown.
- **Connecting**: Establishing connection with Vapi servers.
- **Active**: Conversation in progress — shows "Listening...", "Speaking...", or "Thinking..." sub-states.
- **Ending**: Cleaning up the session.
- **Error**: Something went wrong — retry available.

## 👩🏽‍🍳 The Process

I started by designing the full system architecture before writing any code. This included the component responsibilities, voice communication pipeline, embedding strategy, security model, session lifecycle state machine, and project folder structure.

With the architecture approved, I scaffolded the project with Vite in library mode, outputting an IIFE bundle that can be loaded via a single `<script>` tag. TypeScript strict mode was enabled from the start.

Next, I built the finite state machine — the backbone of the widget. It defines explicit states and valid transitions, preventing impossible UI combinations like showing "Connected" while the microphone is still being requested.

Then I created the Vapi adapter layer, wrapping the `@vapi-ai/web` SDK behind a clean interface. This decouples the widget logic from Vapi's API surface, so if their SDK changes, only one file needs updating.

For the UI, I chose vanilla TypeScript with DOM APIs instead of React or Vue. This keeps the bundle small (~40-60KB) and avoids framework version conflicts with host websites. Everything renders inside a Shadow DOM for complete style isolation.

After the core was working, I ran a production readiness audit. This caught several issues: a double microphone permission prompt (fixed by using the Permissions API instead of a redundant `getUserMedia` call), a race condition in the ending state cleanup timer, and missing browser capability detection. All were fixed before release.

Next, I added a chat mode so users can type text messages during an active voice call. This required extending the Vapi adapter with a `sendMessage` method, adding a text input component to the panel, and introducing a `mode` config option (`voice`, `chat`, or `both`). Keyboard shortcuts were added for accessibility — Escape to close the panel, Ctrl+Shift+V to toggle it — along with focus-visible outlines for keyboard navigation.

Finally, I added a comprehensive test suite using Vitest with jsdom. The tests cover the state machine (transitions, timeouts, sub-states, error recovery), event bus (pub/sub, error isolation), config parsing (attribute variants, defaults, validation), and widget lifecycle integration (Shadow DOM rendering, chat mode toggling, event subscription, cleanup).

## 📚 What I Learned

### 🧠 Finite State Machines:

- **Explicit State Management**: Building the session state machine taught me the value of defining every possible state and transition upfront. It eliminated entire categories of bugs — no more checking three boolean flags to figure out what the UI should show.

### 🔊 WebRTC and Voice Streaming:

- **Real-time Audio**: I learned how WebRTC handles audio streaming with Opus codec at ~20ms frames, and how Vapi abstracts the ICE/SDP negotiation behind a simple `start()`/`stop()` API.

### 🛡️ Shadow DOM and Web Components:

- **Style Isolation**: I discovered that Shadow DOM is the right tool for embeddable widgets — it completely prevents CSS collisions without the performance overhead of an iframe.
- **Custom Elements**: Registering a custom element (`<voice-agent-widget>`) made the embedding API feel native to HTML.

### 🎤 Browser Permissions API:

- **Permission Checks Without Prompts**: I learned to use `navigator.permissions.query()` to check microphone permission state without triggering the browser prompt, avoiding the double-prompt issue.

### 📦 Library Bundling with Vite:

- **IIFE Output**: Configuring Vite's library mode to output an IIFE bundle that works via `<script>` tag was a key learning — it required `inlineDynamicImports` and careful entry point configuration.

### 🧪 Testing Embeddable Widgets:

- **Mocking External SDKs**: Testing a widget that wraps a third-party SDK (Vapi) required mocking the SDK as a class constructor, not just a function — a subtle but important distinction in Vitest.
- **Shadow DOM in Tests**: jsdom supports `attachShadow`, so integration tests can verify the full rendering pipeline including style isolation.

### 📈 Overall Growth:

This project deepened my understanding of real-time systems, embeddable SDK design, and the importance of architecture-first development. Designing the system before coding saved significant time by catching issues on paper instead of in code.

## 💭 How can it be improved?

- Add a light theme and auto-detect system preference.
- Add configurable connection timeout duration.
- Add retry with exponential backoff for failed connections.
- Add offline detection and graceful degradation.
- Add analytics event hooks for tracking conversation metrics.
- Add multi-language support for status text and labels.
- Add end-to-end tests with Playwright for browser-level verification.

## 🚦 Running the Project

To run the project in your local environment, follow these steps:

1. Clone the repository to your local machine.
2. Run `npm install` in the project directory to install the required dependencies.
3. Copy `.env.example` to `.env` and add your Vapi credentials:
   ```
   VITE_PUBLIC_KEY=your_vapi_public_key_here
   VITE_ASSISTANT_ID=your_vapi_assistant_id_here
   ```
4. Run `npm run dev` to start the development server.
5. Open [http://localhost:5173](http://localhost:5173) (or the address shown in your console) in your web browser to view the demo.
6. Run `npm test` to execute the test suite.

### 🎯 Keyboard Shortcuts:

- **Escape**: Close the panel.
- **Ctrl+Shift+V** (or Cmd+Shift+V on Mac): Toggle the panel open/closed.

## 🏗️ Embedding

### Custom Element
```html
<script src="https://your-cdn.com/voice-widget.js"></script>
<voice-agent-widget
  public-key="YOUR_PUBLIC_KEY"
  assistant-id="YOUR_ASSISTANT_ID"
  mode="both"
></voice-agent-widget>
```

### Script Tag
```html
<script
  src="https://your-cdn.com/voice-widget.js"
  data-public-key="YOUR_PUBLIC_KEY"
  data-assistant-id="YOUR_ASSISTANT_ID"
></script>
```

### Programmatic API
```javascript
const widget = VoiceAgentWidgetSDK.create({
  publicKey: 'YOUR_PUBLIC_KEY',
  assistantId: 'YOUR_ASSISTANT_ID',
  position: 'bottom-right',
  theme: 'dark',
  mode: 'both', // 'voice', 'chat', or 'both'
});

widget.on('call-start', () => console.log('Conversation started'));
widget.on('call-end', () => console.log('Conversation ended'));
```

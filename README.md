<p align="center">
  <img src="assets/idle.png" alt="Cursor Office" width="460">
</p>

<h1 align="center">Cursor Office</h1>

<p align="center">
  Your AI agent writes your code, reads your files, runs your tests, and fixes your bugs.<br>
  The least you can do is give it an <strong>office</strong>.
</p>

<p align="center">
  <em>You'll find yourself glancing at the bottom panel just to see what it's up to.</em>
</p>

<p align="center">
  <a href="#install"><img src="https://img.shields.io/badge/Install-Guide-blue?style=for-the-badge" alt="Install"></a>
  &nbsp;
  <a href="#contributing"><img src="https://img.shields.io/badge/Plugins-Add_Yours-orange?style=for-the-badge" alt="Plugins"></a>
  &nbsp;
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/Contributing-Guide-green?style=for-the-badge" alt="Contributing"></a>
</p>

<p align="center">
  <a href="https://open-vsx.org/extension/ofershap/cursor-office"><img src="https://img.shields.io/open-vsx/v/ofershap/cursor-office?label=Open%20VSX" alt="Open VSX"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue.svg" alt="TypeScript"></a>
  <a href="https://cursor.com"><img src="https://img.shields.io/badge/Cursor-1.85+-007ACC.svg" alt="Cursor"></a>
  <a href="https://github.com/ofershap/cursor-office"><img src="https://img.shields.io/badge/Sprites-100%25_code-ff69b4.svg" alt="Sprites"></a>
  <a href="https://github.com/ofershap/cursor-office"><img src="https://img.shields.io/badge/Bundle-27KB-brightgreen.svg" alt="Bundle size"></a>
</p>

---

![Cursor Office - pixel art office for Cursor AI agents](assets/demo.gif)

<p align="center"><em>Every sprite is drawn from code. Zero image files. 27KB total.</em></p>

---

## Your Agent Works in a Void

You outsourced your job to an AI agent. It writes code for hours while you get coffee, scroll Twitter, or pretend to be in a meeting. But does it get a desk? A window? A coffee mug?

No. It works in the shades. A terminal. A blinking cursor. That's not how you treat an employee.

**Cursor Office** gives your agent a proper workspace. A desk with a monitor. A bookshelf. A cat. An arcade cabinet for breaks. A window with a real sky that matches your actual time of day. When it writes code, it sits at the desk and types. When it finishes a build, it stands up and celebrates. When it's idle, it gets coffee, pets the cat, waters the plant.

Glance at the bottom panel. Character at the desk? Things are happening. Character wandering? The agent is done. It's ambient awareness, like background music you stop noticing after a day.

---

## What You Actually See

| Your agent is... | The office shows... |
|---|---|
| Writing / editing code | Character sits at desk, types away (back to you, like a real employee) |
| Reading files | At desk, speech bubble shows which file |
| Running commands | At desk with terminal status bubble |
| Idle / between tasks | Wanders the office. Coffee, bookshelf, cat, arcade |
| Build passes | Jumps up and celebrates |

---

## Everything Is Clickable

Your agent's office is better than yours.

| Object | What happens |
|---|---|
| 💡 Lamp | Toggle room lights. The agent works late too |
| 🪟 Window | Open/close curtains. Sky matches real time of day, stars at night |
| 🕹️ Arcade cabinet | Cycles through Space Invaders, Tetris, and Pong on the tiny screen |
| 📚 Bookshelf | Shows book titles: Clean Code, SICP, Design Patterns... |
| 💧 Water cooler | Bubble animation. Hydration matters |
| 🌱 Plant | Grows through 3 stages when you water it (click it!) |
| 🐱 Cat | Nudge it. Purrs, wanders off, comes back |
| ☕ Coffee mug | Steam rises. Always fresh |
| 🤖 Roomba | Drifts in every few minutes to clean the floor |

Click any object while idle and the character walks over to check it out.

---

## Idle Time Is Not Wasted Time

When the agent isn't working, it has a life. It stands around, grabs coffee, browses the bookshelf, pets the cat, plays the arcade, waters the plant, gets water from the cooler. Each activity has randomness baked in so it never feels scripted. The character strolls between spots at a leisurely pace, but rushes to the desk when real work comes in. Just like a real employee.

---

| Idle | Working | Celebrating |
|---|---|---|
| ![idle](assets/idle.png) | ![working](assets/working.png) | ![celebrating](assets/celebrate.png) |

| Lamp off |
|---|
| ![dark mode](assets/dark.png) |

---

## Install

### From Open VSX

Install directly from [Open VSX](https://open-vsx.org/extension/ofershap/cursor-office), or search "Cursor Office" in the Extensions panel.

### From source

```bash
git clone https://github.com/ofershap/cursor-office.git
cd cursor-office
npm install && npm run build
npx vsce package --no-dependencies
```

Then in Cursor: `Cmd+Shift+P` → "Install from VSIX" → select `cursor-office-0.1.0.vsix`.

The office appears as a tab in the bottom panel bar (next to Terminal, Output, etc). Or hit **`Cmd+Shift+.`** to jump straight there.

---

## Zero Modification Required

Cursor Office reads Cursor's JSONL agent transcripts at `~/.cursor/projects/<workspace>/agent-transcripts/`. It watches for file changes and figures out what the agent is doing. No hacks, no patches, no API keys. Read-only. Watches files Cursor already writes.

```
Cursor writes JSONL transcript
    ↓
FileWatcher detects change
    ↓
TranscriptParser infers activity (typing / reading / running / idle)
    ↓
postMessage to webview
    ↓
Character walks to desk / wanders / celebrates
```

---

## Built Different

| | |
|---|---|
| **Extension host** | VS Code / Cursor Extension API |
| **Rendering** | Canvas 2D, requestAnimationFrame, 60fps |
| **Sprites** | Procedural pixel art. Every pixel drawn from code, zero image files |
| **Build** | esbuild, single-file bundle, 27KB |
| **Language** | TypeScript (strict) |
| **Plugin system** | Drop a `.ts` file in `plugins/`. [See the Roomba](plugins/roomba.ts) |

---

## Development

```bash
git clone https://github.com/ofershap/cursor-office.git
cd cursor-office
npm install
npm run build          # one-shot build
npm run watch          # rebuild on save
```

Press F5 in Cursor/VS Code to launch the Extension Development Host.

<details>
<summary>Project structure</summary>

```
src/
├── extension.ts          # Extension entry, registers panel
├── panelProvider.ts       # WebviewViewProvider, HTML injection
├── cursorWatcher.ts       # Watches transcript dirs for changes
└── transcriptParser.ts    # Parses JSONL, infers agent activity

webview/
├── index.ts              # Canvas setup, event handlers, message bridge
├── office.ts             # Renders walls, floor, lighting, z-sorting
├── character.ts          # Movement, idle waypoints, speech bubbles
├── objects.ts            # Built-in interactive objects
├── sprites.ts            # Programmatic pixel art sprite generation
├── hitTest.ts            # Click and hover detection
├── gameLoop.ts           # requestAnimationFrame loop
├── canvas.ts             # Shared drawing utils
└── types.ts              # TypeScript interfaces

plugins/
└── roomba.ts             # Reference plugin, robot vacuum cleaner
```

</details>

---

## Contributing

Drop a `.ts` file in the [`plugins/`](plugins/) folder. The built-in Roomba ([`plugins/roomba.ts`](plugins/roomba.ts)) is the reference. Self-contained robot vacuum with its own sprite, state machine, and animations. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

```typescript
// Your plugin
import { createMyThing } from '../plugins/my-thing';

// Or register at runtime
window.cursorOffice.registerObject(myObject);
```

---

## Sponsor

Want your brand in the office? A mug with your logo, a poster on the wall, a gadget on the desk. Pixel art, fully interactive, seen by every user every session. [Reach out](https://linkedin.com/in/ofershap) or open an issue.

---

## Author

[![Made by ofershap](https://gitshow.dev/api/card/ofershap)](https://gitshow.dev/ofershap)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/ofershap)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github&logoColor=white)](https://github.com/ofershap)

## License

[MIT](LICENSE) &copy; [Ofer Shapira](https://github.com/ofershap)

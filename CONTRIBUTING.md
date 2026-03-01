# Contributing to Cursor Office

Pull requests welcome. Here's how to add things.

## Setup

```bash
git clone https://github.com/ofershap/cursor-office.git
cd cursor-office
npm install
npm run build
```

Press F5 in Cursor/VS Code to launch the Extension Development Host with the extension loaded. Changes to `webview/` or `plugins/` files require a rebuild (`npm run build`) and a reload of the dev host window.

## Plugins

The `plugins/` folder is the home for self-contained office additions. Each plugin is a single `.ts` file that exports a factory function returning an `InteractiveObject`.

```
plugins/
├── roomba.ts        ← reference plugin, a robot vacuum that cleans the office
└── your-plugin.ts   ← your contribution goes here
```

The built-in Roomba plugin ([`plugins/roomba.ts`](plugins/roomba.ts)) is the reference implementation. It shows how to:
- Define a sprite inline using `makeSprite`, `fill`, `outline`
- Manage a multi-phase state machine (waiting → entering → cleaning → exiting → gone)
- Animate movement, flipping, shadow, and particle effects
- Handle clicks differently based on current state

To add your own plugin:

1. Create a file in `plugins/` (e.g. `plugins/disco-ball.ts`)
2. Import what you need from `webview/types` and `webview/sprites`
3. Export a factory function that returns an `InteractiveObject`
4. Import and add it to `createDefaultObjects()` in `webview/objects.ts`

### Plugin template

```typescript
import { InteractiveObject, SpriteData } from '../webview/types';
import { TILE_SIZE, renderSprite, makeSprite, fill } from '../webview/sprites';

const mySprite: SpriteData = (() => {
  const s = makeSprite(12, 12);
  fill(s, 2, 2, 9, 9, '#ff6644');
  return s;
})();

export function createMyThing(col: number, row: number): InteractiveObject {
  return {
    id: 'my-thing',
    sprites: [mySprite],
    position: { col, row },
    hitbox: { w: 12, h: 12 },
    zY: (row + 0.5) * TILE_SIZE,
    state: {},
    onClick: () => '✨ You clicked it!',
    render: (ctx, obj, _tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, mySprite, x, y, scale);
    },
  };
}
```

Then in `webview/objects.ts`:

```typescript
import { createMyThing } from '../plugins/my-thing';

// inside createDefaultObjects():
createMyThing(3.5, 0.4),
```

## InteractiveObject Interface

```typescript
interface InteractiveObject {
  id: string;
  sprites: SpriteData[];
  position: { col: number; row: number };
  hitbox: { w: number; h: number };
  zY: number;
  state: Record<string, unknown>;
  onClick: (obj: InteractiveObject, office: OfficeState) => void;
  render: (ctx: CanvasRenderingContext2D, obj: InteractiveObject, tick: number, scale: number) => void;
}
```

### Fields

- `id` - unique string, used for hit testing and click-to-attract
- `sprites` - array of `SpriteData` (2D color arrays). Can be empty if you draw manually in `render`
- `position` - `{ col, row }` in tile coordinates. The office is 6 columns wide, 3 rows tall. Row 0 is the back wall, row ~2.5 is the front
- `hitbox` - width/height in pixels (not tiles). Gets scaled automatically
- `zY` - y-sort value for depth ordering. Higher = rendered later (in front). Usually `(row + spriteHeightInTiles) * 32`
- `state` - freeform object for your internal state (click counts, timers, toggles)
- `onClick` - called when clicked. Return a string to show it as a speech bubble on the character, or `null` for no bubble
- `render` - draw the object each frame. `tick` is seconds since start, `scale` is the current pixel scale

### Runtime registration

Objects can also be registered at runtime without modifying source:

```typescript
window.cursorOffice.registerObject(myObject);
window.cursorOffice.removeObject('my-thing');
```

## Sprites

Sprites are 2D arrays of hex color strings. Empty string = transparent pixel.

```typescript
const mySprite: SpriteData = [
  ['', '#ffd700', '#ffd700', ''],
  ['#ffd700', '#ffed4a', '#ffed4a', '#ffd700'],
  ['', '#daa520', '#daa520', ''],
];
```

Helper functions from `webview/sprites`:
- `makeSprite(w, h)` - creates a transparent sprite canvas
- `fill(sprite, x1, y1, x2, y2, color)` - fills a rectangle
- `outline(sprite, x1, y1, x2, y2, color)` - draws a rectangle border
- `renderSprite(ctx, sprite, x, y, scale)` - draws a sprite to the canvas

## Backgrounds

Custom office backgrounds (floor and wall themes). Register via the global API.

```typescript
const concreteBackground: BackgroundRenderer = {
  id: 'concrete',
  name: 'Concrete Loft',
  renderFloor: (ctx, cols, rows, wallRows, tileSize, scale, _tick) => {
    for (let r = wallRows; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * tileSize * scale;
        const y = r * tileSize * scale;
        ctx.fillStyle = (c + r) % 2 === 0 ? '#3a3a3a' : '#383838';
        ctx.fillRect(x, y, tileSize * scale, tileSize * scale);
      }
    }
  },
  renderWall: (ctx, cols, wallRows, tileSize, scale, _tick) => {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, cols * tileSize * scale, wallRows * tileSize * scale);
  },
};

window.cursorOffice.registerBackground(concreteBackground);
```

## Character attract

If you want the character to walk to your object when clicked during idle, add an entry in `OBJECT_POSITIONS` in `webview/character.ts`:

```typescript
trophy: { col: 3.5, row: 1.2, action: 'lookAround' },
```

## Code style

- No comments explaining what code does. Only comment non-obvious *why*
- TypeScript strict mode
- No external runtime dependencies
- Sprites as code, no image files

## Submitting

1. Fork the repo
2. Create a file in `plugins/` (or modify existing code)
3. Build and test locally (`npm run build`, F5 to test in dev host)
4. Open a PR with a screenshot showing your addition in the office

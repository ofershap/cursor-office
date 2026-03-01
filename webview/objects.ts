import { InteractiveObject, OfficeState, SpriteData } from './types';
import {
  TILE_SIZE, deskSprite, chairSprite,
  mugSprite1, mugSprite2,
  plantStage1, plantStage2, plantStage3,
  whiteboardSprite, arcadeCabinetSprite,
  lampSprite, lampSpriteOff,
  renderSprite,
} from './sprites';

function defaultRender(ctx: CanvasRenderingContext2D, obj: InteractiveObject, tick: number, scale: number) {
  const sprite = obj.sprites[0];
  if (!sprite) return;
  const x = obj.position.col * TILE_SIZE * scale;
  const y = obj.position.row * TILE_SIZE * scale;
  renderSprite(ctx, sprite, x, y, scale);
}

export function createDesk(col: number, row: number): InteractiveObject {
  return {
    id: 'desk',
    sprites: [deskSprite],
    position: { col, row },
    hitbox: { w: 2, h: 1 },
    zY: (row + 1) * TILE_SIZE,
    state: {},
    onClick: () => {},
    render: defaultRender,
  };
}

export function createChair(col: number, row: number): InteractiveObject {
  return {
    id: 'chair',
    sprites: [chairSprite],
    position: { col, row },
    hitbox: { w: 1, h: 1 },
    zY: (row + 1) * TILE_SIZE,
    state: {},
    onClick: () => {},
    render: defaultRender,
  };
}

export function createCoffeeMug(col: number, row: number): InteractiveObject {
  return {
    id: 'coffee',
    sprites: [mugSprite1, mugSprite2],
    position: { col, row },
    hitbox: { w: 1, h: 1 },
    zY: (row + 1) * TILE_SIZE,
    state: { steaming: false, steamTimer: 0, wiggle: 0 },
    onClick: (obj) => {
      obj.state.steaming = true;
      obj.state.steamTimer = 4;
      obj.state.wiggle = 0.5;
    },
    render: (ctx, obj, tick, scale) => {
      const dt = 0.016;
      if ((obj.state.steamTimer as number) > 0) {
        obj.state.steamTimer = (obj.state.steamTimer as number) - dt;
        if ((obj.state.steamTimer as number) <= 0) {
          obj.state.steaming = false;
          obj.state.steamTimer = 0;
        }
      }
      if ((obj.state.wiggle as number) > 0) {
        obj.state.wiggle = (obj.state.wiggle as number) - dt;
      }

      const x = obj.position.col * TILE_SIZE * scale;
      let y = obj.position.row * TILE_SIZE * scale;

      const wiggleAmount = (obj.state.wiggle as number) > 0
        ? Math.sin(tick * 30) * 2 * scale
        : 0;

      const sprite = obj.state.steaming
        ? (Math.floor(tick * 3) % 2 === 0 ? obj.sprites[1] : obj.sprites[0])
        : obj.sprites[0];
      renderSprite(ctx, sprite!, x + wiggleAmount, y, scale);

      if (obj.state.steaming) {
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
          const sx = x + (3 + i * 2) * scale;
          const sy = y - (4 + Math.sin(tick * 4 + i * 2) * 3) * scale;
          const size = Math.ceil(scale * 0.8);
          ctx.fillStyle = '#ccc';
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    },
  };
}

export function createPlant(col: number, row: number): InteractiveObject {
  return {
    id: 'plant',
    sprites: [plantStage1, plantStage2, plantStage3],
    position: { col, row },
    hitbox: { w: 1, h: 1 },
    zY: (row + 1) * TILE_SIZE,
    state: { stage: 0, clickCount: 0, bounce: 0, lastClickTick: 0 },
    onClick: (obj, office) => {
      obj.state.clickCount = (obj.state.clickCount as number) + 1;
      obj.state.bounce = 1.0;
      obj.state.lastClickTick = office.tick;
      const clicks = obj.state.clickCount as number;
      if (clicks >= 10) obj.state.stage = 2;
      else if (clicks >= 4) obj.state.stage = 1;
    },
    render: (ctx, obj, tick, scale) => {
      const dt = 0.016;
      if ((obj.state.bounce as number) > 0) {
        obj.state.bounce = Math.max(0, (obj.state.bounce as number) - dt * 3);
      }

      const stage = obj.state.stage as number;
      const sprite = obj.sprites[Math.min(stage, obj.sprites.length - 1)];
      const x = obj.position.col * TILE_SIZE * scale;
      let y = obj.position.row * TILE_SIZE * scale;

      const bounceAmt = (obj.state.bounce as number);
      if (bounceAmt > 0) {
        y -= Math.sin(bounceAmt * Math.PI) * 4 * scale;
      }

      const sway = Math.sin(tick * 1.5) * 0.3 * scale * (stage + 1) * 0.3;

      renderSprite(ctx, sprite!, x + sway, y, scale);

      if (stage >= 2) {
        const sparklePhase = (tick * 2) % 3;
        ctx.fillStyle = `rgba(255,230,100,${0.3 + 0.3 * Math.sin(tick * 5)})`;
        const starX = x + (5 + sparklePhase * 3) * scale;
        const starY = y + (1 + Math.sin(tick * 3 + sparklePhase) * 2) * scale;
        drawStar(ctx, starX, starY, scale * 1.5);
      }
    },
  };
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(angle) * size;
    const py = y + Math.sin(angle) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export function createWhiteboard(col: number, row: number): InteractiveObject {
  return {
    id: 'whiteboard',
    sprites: [whiteboardSprite],
    position: { col, row },
    hitbox: { w: 2, h: 2 },
    zY: row * TILE_SIZE,
    state: { text: 'Waiting for agent...' },
    onClick: () => {},
    render: (ctx, obj, tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, obj.sprites[0]!, x, y, scale);

      const text = obj.state.text as string;
      if (text) {
        const fontSize = Math.max(7, 4 * scale);
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.fillStyle = '#333';
        const maxW = 28 * scale;
        const lines = wrapText(ctx, text, maxW);
        lines.forEach((line, i) => {
          ctx.fillText(line, x + 3 * scale, y + (6 + i * 6) * scale, maxW);
        });
      }

      const dotAlpha = 0.4 + 0.3 * Math.sin(tick * 2);
      ctx.fillStyle = `rgba(60,200,60,${dotAlpha})`;
      ctx.beginPath();
      ctx.arc(x + 28 * scale, y + 2 * scale, scale * 1.5, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export function createArcadeCabinet(col: number, row: number): InteractiveObject {
  return {
    id: 'arcade',
    sprites: [arcadeCabinetSprite],
    position: { col, row },
    hitbox: { w: 1, h: 2 },
    zY: (row + 2) * TILE_SIZE,
    state: { clickCount: 0, showBubble: false, bubbleTimer: 0 },
    onClick: (obj) => {
      obj.state.clickCount = (obj.state.clickCount as number) + 1;
      if ((obj.state.clickCount as number) >= 3) {
        obj.state.showBubble = true;
        obj.state.bubbleTimer = 4;
        obj.state.clickCount = 0;
      }
    },
    render: (ctx, obj, tick, scale) => {
      const dt = 0.016;
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, obj.sprites[0]!, x, y, scale);

      // Animated screen glow
      const colors = ['#44ff44', '#4488ff', '#ff4444', '#ffff44'];
      const ci = Math.floor(tick * 2) % colors.length;
      ctx.fillStyle = colors[ci]!;
      ctx.globalAlpha = 0.15 + 0.1 * Math.sin(tick * 5);
      ctx.fillRect(
        Math.floor(x + 4 * scale),
        Math.floor(y + 6 * scale),
        Math.ceil(8 * scale),
        Math.ceil(9 * scale)
      );
      ctx.globalAlpha = 1;

      // Screen scan line effect
      const scanY = ((tick * 20) % 9);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(
        Math.floor(x + 4 * scale),
        Math.floor(y + (6 + scanY) * scale),
        Math.ceil(8 * scale),
        Math.ceil(scale)
      );

      if ((obj.state.bubbleTimer as number) > 0) {
        obj.state.bubbleTimer = (obj.state.bubbleTimer as number) - dt;
        if ((obj.state.bubbleTimer as number) <= 0) {
          obj.state.showBubble = false;
          obj.state.bubbleTimer = 0;
        }
        const fontSize = Math.max(9, 5 * scale);
        ctx.font = `bold ${fontSize}px monospace`;
        const label = 'Coming soon!';
        const tw = ctx.measureText(label).width;
        const bx = x + 8 * scale - tw / 2 - 4 * scale;
        const by = y - fontSize - 8 * scale;
        const bw = tw + 8 * scale;
        const bh = fontSize + 6 * scale;

        ctx.fillStyle = 'rgba(30,30,30,0.9)';
        roundRect(ctx, bx, by, bw, bh, 4 * scale);
        ctx.fill();

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = scale;
        roundRect(ctx, bx, by, bw, bh, 4 * scale);
        ctx.stroke();

        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(label, bx + 4 * scale, by + fontSize + scale);
      }
    },
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function createLamp(col: number, row: number): InteractiveObject {
  return {
    id: 'lamp',
    sprites: [lampSprite, lampSpriteOff],
    position: { col, row },
    hitbox: { w: 1, h: 1 },
    zY: 0,
    state: { on: true, flashTimer: 0 },
    onClick: (obj, office) => {
      obj.state.on = !(obj.state.on as boolean);
      office.dimmed = !(obj.state.on as boolean);
      obj.state.flashTimer = 0.3;
    },
    render: (ctx, obj, tick, scale) => {
      const dt = 0.016;
      if ((obj.state.flashTimer as number) > 0) {
        obj.state.flashTimer = (obj.state.flashTimer as number) - dt;
      }
      const sprite = (obj.state.on as boolean) ? obj.sprites[0] : obj.sprites[1];
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, sprite!, x, y, scale);

      if (obj.state.on as boolean) {
        const cx = x + 8 * scale;
        const cy = y + 6 * scale;
        const pulseR = 30 * scale + Math.sin(tick * 2) * 3 * scale;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        grad.addColorStop(0, 'rgba(255,240,180,0.15)');
        grad.addColorStop(0.5, 'rgba(255,240,180,0.05)');
        grad.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - pulseR, cy - pulseR, pulseR * 2, pulseR * 2);
      }

      if ((obj.state.flashTimer as number) > 0) {
        ctx.fillStyle = `rgba(255,255,200,${(obj.state.flashTimer as number)})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    },
  };
}

export function createDefaultObjects(): InteractiveObject[] {
  return [
    createLamp(9, 0),
    createWhiteboard(12, 1),
    createDesk(3, 6),
    createChair(4, 8),
    createCoffeeMug(6, 6),
    createPlant(1, 9),
    createArcadeCabinet(16, 5),
  ];
}

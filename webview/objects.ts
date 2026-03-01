import { InteractiveObject, OfficeState } from './types';
import { roundRect } from './canvas';
import {
  TILE_SIZE, COLS, deskSprite, chairSprite,
  plantStage1, plantStage2, plantStage3,
  windowSprite, arcadeCabinetSprite,
  lampSprite, lampSpriteOff,
  bookshelfSprite, waterCoolerSprite,
  catSprite1, catSprite2,
  phoneSprite,
  renderSprite,
} from './sprites';
import { createRoomba } from '../plugins/roomba';

let audioCtx: AudioContext | null = null;

function meow() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const base = 700 + Math.random() * 150;
    const dur = 0.25 + Math.random() * 0.1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    // "me-ow": rise then fall
    osc.frequency.setValueAtTime(base * 0.7, now);
    osc.frequency.linearRampToValueAtTime(base, now + dur * 0.3);
    osc.frequency.linearRampToValueAtTime(base * 0.45, now + dur);

    // Vibrato for realism
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.value = 20 + Math.random() * 10;
    vibGain.gain.value = 15;
    vib.connect(vibGain).connect(osc.frequency);
    vib.start(now);
    vib.stop(now + dur);

    // Second harmonic for nasal quality
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(base * 1.4, now);
    osc2.frequency.linearRampToValueAtTime(base * 2, now + dur * 0.3);
    osc2.frequency.linearRampToValueAtTime(base * 0.9, now + dur);
    gain2.gain.setValueAtTime(0.03, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + dur);

    // Envelope: quick attack, sustain, fade
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.setValueAtTime(0.15, now + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  } catch {}
}

function defaultRender(ctx: CanvasRenderingContext2D, obj: InteractiveObject, _tick: number, scale: number) {
  const sprite = obj.sprites[0];
  if (!sprite) return;
  renderSprite(ctx, sprite, obj.position.col * TILE_SIZE * scale, obj.position.row * TILE_SIZE * scale, scale);
}

export function createDesk(col: number, row: number): InteractiveObject {
  return {
    id: 'desk', sprites: [deskSprite], position: { col, row },
    hitbox: { w: 64, h: 44 }, zY: (row + 1.4) * TILE_SIZE,
    state: {}, onClick: () => {}, render: defaultRender,
  };
}

export function createChair(col: number, row: number): InteractiveObject {
  return {
    id: 'chair', sprites: [chairSprite], position: { col, row },
    hitbox: { w: 28, h: 32 }, zY: (row + 1) * TILE_SIZE,
    state: {}, onClick: () => {}, render: defaultRender,
  };
}

export function createPlant(col: number, row: number): InteractiveObject {
  return {
    id: 'plant', sprites: [plantStage1, plantStage2, plantStage3],
    position: { col, row }, hitbox: { w: 24, h: 32 },
    zY: (row + 1) * TILE_SIZE,
    state: { stage: 0, clicks: 0, bounce: 0 },
    onClick: (obj) => {
      obj.state.clicks = (obj.state.clicks as number) + 1;
      obj.state.bounce = 1.0;
      const c = obj.state.clicks as number;
      if (c >= 10) obj.state.stage = 2;
      else if (c >= 4) obj.state.stage = 1;
      const stage = obj.state.stage as number;
      return stage === 2 ? '🌸 Fully grown!' : stage === 1 ? '🌿 Growing!' : '🌱 Water me!';
    },
    render: (ctx, obj, tick, scale) => {
      if ((obj.state.bounce as number) > 0)
        obj.state.bounce = Math.max(0, (obj.state.bounce as number) - 0.016 * 3);
      const stage = Math.min(obj.state.stage as number, 2);
      const sprite = obj.sprites[stage];
      const x = obj.position.col * TILE_SIZE * scale;
      let y = obj.position.row * TILE_SIZE * scale;
      if ((obj.state.bounce as number) > 0) y -= Math.sin((obj.state.bounce as number) * Math.PI) * 4 * scale;
      const sway = Math.sin(tick * 1.2) * 0.4 * scale * (stage + 1) * 0.3;
      renderSprite(ctx, sprite!, x + sway, y, scale);
      if (stage >= 2) {
        const alpha = 0.3 + 0.3 * Math.sin(tick * 4);
        ctx.fillStyle = `rgba(255,230,100,${alpha})`;
        for (let i = 0; i < 3; i++) {
          const sx = x + (4 + i * 3 + Math.sin(tick * 2 + i) * 1.5) * scale;
          const sy = y + (1 + Math.sin(tick * 3 + i * 2) * 2) * scale;
          ctx.beginPath(); ctx.arc(sx, sy, scale * 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
  };
}

export function createWindow(col: number, row: number): InteractiveObject {
  return {
    id: 'window', sprites: [windowSprite], position: { col, row },
    hitbox: { w: 30, h: 22 }, zY: row * TILE_SIZE,
    state: { open: false },
    onClick: (obj) => {
      obj.state.open = !(obj.state.open as boolean);
      return (obj.state.open as boolean) ? '🪟 Fresh air!' : '🪟 Closed';
    },
    render: (ctx, obj, tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;

      const hour = new Date().getHours();
      const isNight = hour < 6 || hour >= 20;
      const isSunset = hour >= 17 && hour < 20;

      let skyTop: string, skyBot: string;
      if (isNight) {
        skyTop = '#0a0a2a'; skyBot = '#1a1a3a';
      } else if (isSunset) {
        skyTop = '#2a3060'; skyBot = '#dd7744';
      } else {
        skyTop = '#4488cc'; skyBot = '#88bbdd';
      }

      const grad = ctx.createLinearGradient(x, y + 2 * scale, x, y + 17 * scale);
      grad.addColorStop(0, skyTop);
      grad.addColorStop(1, skyBot);
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2 * scale, y + 2 * scale, 12 * scale, 15 * scale);
      ctx.fillRect(x + 16 * scale, y + 2 * scale, 12 * scale, 15 * scale);

      if (isNight) {
        ctx.fillStyle = '#ffffff';
        const stars = [[4,3],[8,6],[18,3],[24,6],[21,4],[6,8]];
        for (const [sx, sy] of stars) {
          const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(tick * 1.5 + sx + sy));
          ctx.globalAlpha = twinkle;
          ctx.fillRect(x + sx * scale, y + sy * scale, scale, scale);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#eeeedd';
        ctx.beginPath();
        ctx.arc(x + 23 * scale, y + 5 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        const cloudX = ((tick * 3) % 32) - 4;
        ctx.beginPath();
        ctx.arc(x + cloudX * scale, y + 6 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.arc(x + (cloudX + 2.5) * scale, y + 5 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.arc(x + (cloudX + 5) * scale, y + 6 * scale, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        if (isSunset) {
          ctx.fillStyle = '#ff8844';
          ctx.beginPath();
          ctx.arc(x + 8 * scale, y + 15 * scale, 3 * scale, Math.PI, 0);
          ctx.fill();
        }
      }

      ctx.fillStyle = isNight ? '#0a0a18' : '#334455';
      const buildings = [
        [3,13,5,17], [5,11,8,17], [9,14,11,17],
        [17,12,19,17], [20,14,22,17], [23,11,26,17], [26,13,28,17]
      ];
      for (const [bx1, by1, bx2, by2] of buildings) {
        ctx.fillRect(x + bx1 * scale, y + by1 * scale, (bx2 - bx1) * scale, (by2 - by1) * scale);
      }
      if (isNight) {
        ctx.fillStyle = '#ffdd66';
        const wins = [[4,14],[6,12],[7,14],[21,13],[24,12],[27,15]];
        for (const [wx, wy] of wins) {
          if (Math.sin(tick * 0.5 + wx + wy) > -0.3)
            ctx.fillRect(x + wx * scale, y + wy * scale, scale, scale);
        }
      }

      renderSprite(ctx, windowSprite, x, y, scale);

      if (!(obj.state.open as boolean)) {
        ctx.fillStyle = 'rgba(140,80,60,0.35)';
        ctx.fillRect(x + 2 * scale, y + 2 * scale, 3 * scale, 15 * scale);
        ctx.fillRect(x + 11 * scale, y + 2 * scale, 3 * scale, 15 * scale);
        ctx.fillRect(x + 16 * scale, y + 2 * scale, 3 * scale, 15 * scale);
        ctx.fillRect(x + 25 * scale, y + 2 * scale, 3 * scale, 15 * scale);
      }

      if ((obj.state.open as boolean) && !isNight) {
        const lightGrad = ctx.createLinearGradient(x + 4 * scale, y + 22 * scale, x + 4 * scale, y + 40 * scale);
        lightGrad.addColorStop(0, 'rgba(255,240,200,0.08)');
        lightGrad.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(x + 2 * scale, y + 22 * scale, 26 * scale, 18 * scale);
      }
    },
  };
}

function renderMiniGame(ctx: CanvasRenderingContext2D, game: number, tick: number, sx: number, sy: number, sw: number, sh: number, scale: number) {
  const ps = scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx, sy, sw, sh);
  ctx.clip();

  if (game === 0) {
    // Space invaders
    const invaderW = 3 * ps, invaderH = 2 * ps;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const ix = sx + (1 + col * 4) * ps + Math.sin(tick * 2) * ps;
        const iy = sy + (1 + row * 3) * ps;
        ctx.fillStyle = row === 0 ? '#ff4444' : row === 1 ? '#44ff44' : '#4488ff';
        ctx.fillRect(ix, iy, invaderW, invaderH);
      }
    }
    ctx.fillStyle = '#22ff44';
    const shipX = sx + 5 * ps + Math.sin(tick * 3) * 3 * ps;
    ctx.fillRect(shipX, sy + sh - 3 * ps, 3 * ps, 2 * ps);
    // Bullet
    const bulletY = sy + sh - (3 + ((tick * 12) % 10)) * ps;
    if (bulletY > sy) { ctx.fillStyle = '#ffffff'; ctx.fillRect(shipX + ps, bulletY, ps, 2 * ps); }
  } else if (game === 1) {
    // Tetris
    const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffff44', '#ff88ff'];
    const gridW = Math.floor(sw / ps);
    for (let bx = 0; bx < gridW; bx++) {
      const h = ((bx * 7 + 3) % 5) + 1;
      ctx.fillStyle = colors[bx % colors.length]!;
      for (let by = 0; by < h; by++) {
        ctx.fillRect(sx + bx * ps, sy + sh - (by + 1) * ps, ps, ps);
      }
    }
    // Falling piece
    const pieceX = sx + (Math.floor(tick * 2) % gridW) * ps;
    const pieceY = sy + ((tick * 6) % (sh / ps)) * ps;
    ctx.fillStyle = colors[Math.floor(tick) % colors.length]!;
    ctx.fillRect(pieceX, pieceY, 2 * ps, ps);
    ctx.fillRect(pieceX, pieceY + ps, 2 * ps, ps);
  } else {
    // Pong
    const ballX = sx + sw / 2 + Math.sin(tick * 4) * (sw / 2 - 2 * ps);
    const ballY = sy + sh / 2 + Math.cos(tick * 3) * (sh / 2 - 2 * ps);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ballX, ballY, ps, ps);
    // Paddles
    const lp = sy + sh / 2 + Math.sin(tick * 3) * (sh / 3);
    const rp = sy + sh / 2 + Math.cos(tick * 4) * (sh / 3);
    ctx.fillRect(sx + ps, lp, ps, 3 * ps);
    ctx.fillRect(sx + sw - 2 * ps, rp, ps, 3 * ps);
    // Center line
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let dy = 0; dy < sh; dy += 3 * ps) ctx.fillRect(sx + sw / 2, sy + dy, ps * 0.5, ps);
  }
  ctx.restore();
}

export function createArcadeCabinet(col: number, row: number): InteractiveObject {
  return {
    id: 'arcade', sprites: [arcadeCabinetSprite], position: { col, row },
    hitbox: { w: 28, h: 56 }, zY: (row + 1) * TILE_SIZE,
    state: { game: 0 },
    onClick: (obj) => {
      obj.state.game = ((obj.state.game as number) + 1) % 3;
      const names = ['👾 Space Invaders', '🧱 Tetris', '🏓 Pong'];
      return names[obj.state.game as number];
    },
    render: (ctx, obj, tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, obj.sprites[0]!, x, y, scale);

      // Mini-game on screen area (pixels 7-20 x, 11-26 y in sprite)
      const screenX = x + 7 * scale;
      const screenY = y + 11 * scale;
      const screenW = 14 * scale;
      const screenH = 16 * scale;
      renderMiniGame(ctx, obj.state.game as number, tick, screenX, screenY, screenW, screenH, scale);

      // Scanline effect
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      for (let sl = 0; sl < screenH; sl += 2 * scale)
        ctx.fillRect(screenX, screenY + sl, screenW, scale);

      // Screen glow
      const glowR = 10 * scale;
      const gcx = x + 14 * scale;
      const gcy = y + 32 * scale;
      const grad = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, glowR);
      grad.addColorStop(0, 'rgba(100,200,100,0.05)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gcx - glowR, gcy - glowR / 2, glowR * 2, glowR);
    },
  };
}

export function createLamp(col: number, row: number): InteractiveObject {
  return {
    id: 'lamp', sprites: [lampSprite, lampSpriteOff], position: { col, row },
    hitbox: { w: 24, h: 14 }, zY: 0,
    state: { on: true, flashTimer: 0 },
    onClick: (obj, office) => {
      obj.state.on = !(obj.state.on as boolean);
      office.dimmed = !(obj.state.on as boolean);
      obj.state.flashTimer = 0.25;
      return (obj.state.on as boolean) ? '💡 Light on' : '🌙 Light off';
    },
    render: (ctx, obj, _tick, scale) => {
      if ((obj.state.flashTimer as number) > 0)
        obj.state.flashTimer = (obj.state.flashTimer as number) - 0.016;
      const sprite = (obj.state.on as boolean) ? obj.sprites[0] : obj.sprites[1];
      renderSprite(ctx, sprite!, obj.position.col * TILE_SIZE * scale, obj.position.row * TILE_SIZE * scale, scale);
      if ((obj.state.flashTimer as number) > 0) {
        ctx.fillStyle = `rgba(255,255,200,${(obj.state.flashTimer as number) * 0.8})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    },
  };
}

// Bookshelf — full title, wider bubble
export function createBookshelf(col: number, row: number): InteractiveObject {
  return {
    id: 'bookshelf', sprites: [bookshelfSprite], position: { col, row },
    hitbox: { w: 16, h: 32 }, zY: row * TILE_SIZE + 32,
    state: { selected: -1, bubbleTimer: 0, title: '' },
    onClick: (obj) => {
      const titles = ['Clean Code', 'SICP', 'Design Patterns', 'Pragmatic Prog.', 'YDKJS', 'Refactoring'];
      obj.state.selected = ((obj.state.selected as number) + 1) % titles.length;
      obj.state.title = titles[obj.state.selected as number];
      obj.state.bubbleTimer = 3;
      return null;
    },
    render: (ctx, obj, _tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, bookshelfSprite, x, y, scale);

      if ((obj.state.bubbleTimer as number) > 0) {
        obj.state.bubbleTimer = (obj.state.bubbleTimer as number) - 0.016;
        const fontSize = Math.max(8, Math.round(3.8 * scale));
        ctx.font = `bold ${fontSize}px monospace`;
        const label = `📚 ${obj.state.title as string}`;
        const tw = ctx.measureText(label).width;
        const pad = 5 * scale;
        const bw = tw + pad * 2;
        const bh = fontSize + pad * 1.5;
        const sceneW = 6 * TILE_SIZE * scale;
        let bx = x + 8 * scale - bw / 2;
        let by = y - bh - 4 * scale;
        if (bx < 2 * scale) bx = 2 * scale;
        if (bx + bw > sceneW - 2 * scale) bx = sceneW - bw - 2 * scale;
        if (by < 2 * scale) by = 2 * scale;
        ctx.fillStyle = 'rgba(20,20,30,0.92)';
        roundRect(ctx, bx, by, bw, bh, 3 * scale);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,180,140,0.5)';
        ctx.lineWidth = Math.max(1, scale * 0.4);
        roundRect(ctx, bx, by, bw, bh, 3 * scale);
        ctx.stroke();
        ctx.fillStyle = '#e0d8c0';
        ctx.fillText(label, bx + pad, by + pad + fontSize * 0.7);
      }
    },
  };
}

export function createWaterCooler(col: number, row: number): InteractiveObject {
  return {
    id: 'watercooler', sprites: [waterCoolerSprite], position: { col, row },
    hitbox: { w: 20, h: 38 }, zY: row * TILE_SIZE + 24,
    state: { bubbleTimer: 0 },
    onClick: (obj) => { obj.state.bubbleTimer = 2; return '💧 Glug glug...'; },
    render: (ctx, obj, tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      renderSprite(ctx, waterCoolerSprite, x, y, scale);
      if ((obj.state.bubbleTimer as number) > 0) {
        obj.state.bubbleTimer = (obj.state.bubbleTimer as number) - 0.016;
        for (let i = 0; i < 4; i++) {
          const bx = x + (6 + Math.sin(tick * 3 + i * 1.5) * 2) * scale;
          const by = y + (1 + i * 1.5 - (2 - (obj.state.bubbleTimer as number)) * 2) * scale;
          ctx.fillStyle = `rgba(136,204,238,${0.4 + 0.2 * Math.sin(tick * 5 + i)})`;
          ctx.beginPath(); ctx.arc(bx, by, (1.2 - i * 0.15) * scale, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
  };
}

// Rug — soft woven carpet with visible textile texture and tassels
export function createRug(col: number, row: number): InteractiveObject {
  return {
    id: 'rug', sprites: [], position: { col, row },
    hitbox: { w: 56, h: 36 }, zY: row * TILE_SIZE,
    state: {}, onClick: () => null,
    render: (ctx, _obj, _tick, scale) => {
      const x = col * TILE_SIZE * scale;
      const y = row * TILE_SIZE * scale;
      const w = 56 * scale;
      const h = 36 * scale;

      // Soft warm carpet base
      ctx.fillStyle = '#b07858';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#c08868';
      ctx.fillRect(x + scale, y + scale, w - 2 * scale, h - 2 * scale);

      // Woven texture lines (horizontal)
      ctx.strokeStyle = 'rgba(160,120,80,0.3)';
      ctx.lineWidth = scale * 0.4;
      for (let dy = 3; dy < 30; dy += 3) {
        ctx.beginPath();
        ctx.moveTo(x + 2 * scale, y + dy * scale);
        ctx.lineTo(x + w - 2 * scale, y + dy * scale);
        ctx.stroke();
      }

      // Border stripe
      ctx.strokeStyle = '#8a5a3a';
      ctx.lineWidth = scale * 0.8;
      ctx.strokeRect(x + 2.5 * scale, y + 2.5 * scale, w - 5 * scale, h - 5 * scale);

      // Inner pattern — small repeating diamonds
      ctx.fillStyle = '#9a6848';
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          const px = x + (6 + dx * 8) * scale;
          const py = y + (7 + dy * 8) * scale;
          const ds = 2 * scale;
          ctx.beginPath();
          ctx.moveTo(px, py - ds); ctx.lineTo(px + ds, py);
          ctx.lineTo(px, py + ds); ctx.lineTo(px - ds, py);
          ctx.closePath(); ctx.fill();
        }
      }

      // Tassels on top and bottom edges
      ctx.fillStyle = '#c09878';
      for (let i = 0; i < 10; i++) {
        const tx = x + (2 + i * 4.5) * scale;
        ctx.fillRect(tx, y - 1.5 * scale, scale * 0.7, 2 * scale);
        ctx.fillRect(tx, y + h - 0.5 * scale, scale * 0.7, 2 * scale);
      }
    },
  };
}

// Cat pet — wanders around, nudge-able on click
export function createCat(col: number, row: number): InteractiveObject {
  return {
    id: 'cat', sprites: [catSprite1, catSprite2], position: { col, row },
    hitbox: { w: 20, h: 14 }, zY: (row + 0.5) * TILE_SIZE,
    state: {
      targetCol: col, targetRow: row,
      moveTimer: 3 + Math.random() * 4,
      nudged: 0, purring: 0,
      facingRight: true,
    },
    onClick: (obj) => {
      obj.state.nudged = 1.0;
      obj.state.purring = 3;
      const dx = (Math.random() - 0.5) * 3;
      const dy = (Math.random() - 0.5) * 2;
      const newCol = Math.max(0.5, Math.min(5.2, (obj.position.col + dx)));
      const newRow = Math.max(1.2, Math.min(2.5, (obj.position.row + dy)));
      obj.state.targetCol = newCol;
      obj.state.targetRow = newRow;
      meow();
      return '🐱 Mrrp!';
    },
    render: (ctx, obj, tick, scale) => {
      const dt = 0.016;

      // Wander AI
      obj.state.moveTimer = (obj.state.moveTimer as number) - dt;
      if ((obj.state.moveTimer as number) <= 0) {
        obj.state.moveTimer = 4 + Math.random() * 6;
        obj.state.targetCol = 0.5 + Math.random() * 4.5;
        obj.state.targetRow = 1.2 + Math.random() * 1.3;
      }

      // Move toward target
      const tcol = obj.state.targetCol as number;
      const trow = obj.state.targetRow as number;
      const dx = tcol - obj.position.col;
      const dy = trow - obj.position.row;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.1) {
        const speed = 0.8 * dt;
        obj.position.col += (dx / dist) * speed;
        obj.position.row += (dy / dist) * speed;
        obj.state.facingRight = dx > 0;
      }

      // Update z for sorting
      obj.zY = (obj.position.row + 0.5) * TILE_SIZE;

      // Nudge bounce
      if ((obj.state.nudged as number) > 0)
        obj.state.nudged = Math.max(0, (obj.state.nudged as number) - dt * 3);
      if ((obj.state.purring as number) > 0)
        obj.state.purring = Math.max(0, (obj.state.purring as number) - dt);

      const x = obj.position.col * TILE_SIZE * scale;
      let y = obj.position.row * TILE_SIZE * scale;

      // Bounce on nudge
      if ((obj.state.nudged as number) > 0)
        y -= Math.sin((obj.state.nudged as number) * Math.PI) * 4 * scale;

      // Bob while walking
      if (dist > 0.1)
        y += Math.sin(tick * 8) * 0.5 * scale;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(x + 6 * scale, obj.position.row * TILE_SIZE * scale + 8 * scale, 4 * scale, 1.2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sprite — alternate tail while moving
      const sprite = (dist > 0.1 && Math.floor(tick * 3) % 2 === 0) ? obj.sprites[1] : obj.sprites[0];

      if (!(obj.state.facingRight as boolean)) {
        ctx.save();
        ctx.translate(x + 12 * scale, 0);
        ctx.scale(-1, 1);
        renderSprite(ctx, sprite!, 0, y, scale);
        ctx.restore();
      } else {
        renderSprite(ctx, sprite!, x, y, scale);
      }

      // Purr hearts
      if ((obj.state.purring as number) > 0) {
        const ha = 0.3 + 0.3 * Math.sin(tick * 5);
        ctx.fillStyle = `rgba(255,100,100,${ha})`;
        ctx.font = `${Math.max(8, 3 * scale)}px sans-serif`;
        ctx.fillText('♥', x + 4 * scale, y - 2 * scale);
      }
    },
  };
}

function createCoffeeMug(col: number, row: number): InteractiveObject {
  return {
    id: 'coffee', sprites: [], position: { col, row },
    hitbox: { w: 8, h: 10 }, zY: (row + 0.3) * TILE_SIZE,
    state: { steamTimer: 0 },
    onClick: (obj) => { obj.state.steamTimer = 3; return '☕ Ahh, fresh coffee'; },
    render: (ctx, obj, tick, scale) => {
      if ((obj.state.steamTimer as number) > 0) {
        obj.state.steamTimer = (obj.state.steamTimer as number) - 0.016;
        const x = obj.position.col * TILE_SIZE * scale;
        const y = obj.position.row * TILE_SIZE * scale;
        for (let i = 0; i < 3; i++) {
          const sx = x + (2 + i * 2) * scale;
          const sy = y - (2 + i * 1.5 + (3 - (obj.state.steamTimer as number)) * 2) * scale;
          const alpha = 0.3 + 0.2 * Math.sin(tick * 4 + i * 2);
          ctx.fillStyle = `rgba(220,220,220,${alpha})`;
          ctx.beginPath();
          ctx.arc(sx + Math.sin(tick * 3 + i) * scale, sy, (1.5 - i * 0.3) * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  };
}

function createPhone(col: number, row: number): InteractiveObject {
  return {
    id: 'phone', sprites: [phoneSprite], position: { col, row },
    hitbox: { w: 16, h: 14 }, zY: (row + 1.1) * TILE_SIZE,
    state: { ringing: false, ringTimer: 0 },
    onClick: (obj) => {
      obj.state.ringing = !(obj.state.ringing as boolean);
      return (obj.state.ringing as boolean) ? '📞 Ring ring!' : '📞 Hung up';
    },
    render: (ctx, obj, tick, scale) => {
      const x = obj.position.col * TILE_SIZE * scale;
      const y = obj.position.row * TILE_SIZE * scale;
      let drawX = x;
      if (obj.state.ringing as boolean) {
        drawX += Math.sin(tick * 20) * 0.5 * scale;
      }
      renderSprite(ctx, phoneSprite, drawX, y, scale);
    },
  };
}

export function createDefaultObjects(): InteractiveObject[] {
  return [
    createRug(1.5, 1.4),
    createLamp(0.5, 0),
    createWindow(3.8, 0.15),
    createDesk(1.5, 0.6),
    createChair(1.8, 1.3),
    createPhone(1.6, 1.0),
    createCoffeeMug(3, 0.85),
    createBookshelf(5.1, 0.2),
    createWaterCooler(4.5, 1.5),
    createArcadeCabinet(0, 0.8),
    createPlant(5.2, 2),
    createCat(3, 1.8),
    createRoomba(),
  ];
}

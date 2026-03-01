import { CharacterState, AgentActivity } from './types';
import { characterSprites, renderSprite, TILE_SIZE } from './sprites';

export function createCharacter(col: number, row: number): CharacterState {
  return {
    activity: 'idle',
    position: { col, row },
    targetPosition: null,
    animFrame: 0,
    speechBubble: null,
    speechBubbleTimer: 0,
    facingDir: 'down',
  };
}

export function updateCharacter(char: CharacterState, dt: number) {
  char.animFrame += dt * 4;

  if (char.speechBubbleTimer > 0) {
    char.speechBubbleTimer -= dt;
    if (char.speechBubbleTimer <= 0) {
      char.speechBubble = null;
      char.speechBubbleTimer = 0;
    }
  }
}

export function setActivity(char: CharacterState, activity: AgentActivity, statusText?: string) {
  const prev = char.activity;
  char.activity = activity;
  if (statusText) {
    char.speechBubble = statusText;
    char.speechBubbleTimer = 5;
  }
  if (activity === 'celebrating' && prev !== 'celebrating') {
    char.animFrame = 0;
  }
}

export function renderCharacter(ctx: CanvasRenderingContext2D, char: CharacterState, x: number, y: number, scale: number) {
  const sprites = characterSprites;
  let sprite;

  const breathe = Math.sin(char.animFrame * 0.8) * 0.5 * scale;

  switch (char.activity) {
    case 'typing':
    case 'editing':
    case 'running':
    case 'searching':
    case 'reading':
      sprite = Math.floor(char.animFrame * 1.5) % 2 === 0 ? sprites.type1 : sprites.type2;
      break;
    case 'celebrating':
      sprite = sprites.celebrate;
      y -= Math.abs(Math.sin(char.animFrame * 3)) * 3 * scale;
      break;
    case 'walking':
      sprite = Math.floor(char.animFrame * 2) % 2 === 0 ? sprites.idle : sprites.type1;
      break;
    default:
      sprite = sprites.idle;
      y += breathe;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(
    x + 8 * scale,
    y + 20 * scale,
    5 * scale,
    2 * scale,
    0, 0, Math.PI * 2
  );
  ctx.fill();

  renderSprite(ctx, sprite, x, y, scale);

  if (char.speechBubble) {
    renderSpeechBubble(ctx, char.speechBubble, x, y, scale, char);
  }
}

function renderSpeechBubble(ctx: CanvasRenderingContext2D, text: string, charX: number, charY: number, scale: number, char: CharacterState) {
  const fontSize = Math.max(9, 5 * scale);
  ctx.font = `bold ${fontSize}px monospace`;

  const displayText = text.length > 25 ? text.slice(0, 22) + '...' : text;
  const metrics = ctx.measureText(displayText);
  const textW = metrics.width;
  const padX = 6 * scale;
  const padY = 4 * scale;
  const bubbleW = textW + padX * 2;
  const bubbleH = fontSize + padY * 2;
  const bx = charX + 8 * scale - bubbleW / 2;
  const by = charY - bubbleH - 6 * scale;

  // Bubble background with border
  ctx.fillStyle = 'rgba(30,30,50,0.92)';
  const r = 4 * scale;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bubbleW - r, by);
  ctx.quadraticCurveTo(bx + bubbleW, by, bx + bubbleW, by + r);
  ctx.lineTo(bx + bubbleW, by + bubbleH - r);
  ctx.quadraticCurveTo(bx + bubbleW, by + bubbleH, bx + bubbleW - r, by + bubbleH);
  ctx.lineTo(bx + r, by + bubbleH);
  ctx.quadraticCurveTo(bx, by + bubbleH, bx, by + bubbleH - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(100,180,255,0.6)';
  ctx.lineWidth = Math.max(1, scale * 0.5);
  ctx.stroke();

  // Tail
  ctx.fillStyle = 'rgba(30,30,50,0.92)';
  ctx.beginPath();
  ctx.moveTo(charX + 5 * scale, by + bubbleH);
  ctx.lineTo(charX + 8 * scale, by + bubbleH + 5 * scale);
  ctx.lineTo(charX + 11 * scale, by + bubbleH);
  ctx.closePath();
  ctx.fill();

  // Activity icon
  let icon = '';
  switch (char.activity) {
    case 'reading': icon = '📖 '; break;
    case 'editing': icon = '✏️ '; break;
    case 'running': icon = '⚡ '; break;
    case 'searching': icon = '🔍 '; break;
    case 'typing': icon = '⌨️ '; break;
    case 'celebrating': icon = '🎉 '; break;
  }

  ctx.fillStyle = '#e0e8ff';
  ctx.fillText(icon + displayText, bx + padX, by + padY + fontSize * 0.82);
}

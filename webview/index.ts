import { OfficeState, AgentMessage, AgentActivity } from './types';
import { createDefaultObjects } from './objects';
import { createCharacter, setActivity } from './character';
import { startGameLoop } from './gameLoop';
import { handleClick, updateHover } from './hitTest';
import { TILE_SIZE } from './sprites';

declare function acquireVsCodeApi(): {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

const vscode = acquireVsCodeApi();

const COLS = 20;
const ROWS = 12;

const canvas = document.getElementById('officeCanvas') as HTMLCanvasElement;
let scale = 3;

function resize() {
  const availW = window.innerWidth;
  const availH = window.innerHeight;
  const nativeW = COLS * TILE_SIZE;
  const nativeH = ROWS * TILE_SIZE;
  scale = Math.min(availW / nativeW, availH / nativeH);
  canvas.width = Math.floor(nativeW * scale);
  canvas.height = Math.floor(nativeH * scale);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.imageSmoothingEnabled = false;
}

const state: OfficeState = {
  objects: createDefaultObjects(),
  character: createCharacter(4, 7),
  dimmed: false,
  tick: 0,
  agentStatus: null,
  hoveredObjectId: null,
};

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  handleClick(mx, my, state, scale);
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  updateHover(mx, my, state, scale);
  canvas.style.cursor = state.hoveredObjectId ? 'pointer' : 'default';
});

window.addEventListener('message', (e) => {
  const msg = e.data as AgentMessage;
  if (msg.type === 'agentStatus') {
    setActivity(state.character, msg.activity, msg.statusText ?? undefined);

    const whiteboard = state.objects.find(o => o.id === 'whiteboard');
    if (whiteboard && msg.statusText) {
      whiteboard.state.text = msg.statusText;
    }
    if (whiteboard && msg.activity === 'idle') {
      whiteboard.state.text = 'Agent idle';
    }
  }
});

window.addEventListener('resize', resize);
resize();
startGameLoop(canvas, state, () => scale);

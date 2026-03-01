import { SpriteData } from './types';

const _ = '';
const B = '#2c2137';
const W = '#f2f0e5';
const G = '#3e8948';
const DG = '#265c42';
const LG = '#63c74d';
const BR = '#8b6144';
const DB = '#5a3a28';
const LB = '#c0915e';
const GR = '#5a5a6e';
const DGR = '#3a3a4e';
const LGR = '#8b8b9e';
const BL = '#3b5dc9';
const RD = '#e43b44';
const YL = '#f7e26b';
const WH = '#e8e8e8';
const SK = '#f2c8a0';
const HA = '#4a3728';
const SH = '#3b5dc9';

export const TILE_SIZE = 16;

export const floorTile: SpriteData = (() => {
  const C1 = '#c0915e';
  const C2 = '#b5844f';
  const C3 = '#a87842';
  const C4 = '#c99b6a';
  const row1 = [C1,C1,C2,C1,C1,C4,C1,C1,C2,C1,C1,C1,C4,C1,C2,C1];
  const row2 = [C2,C1,C1,C1,C1,C1,C2,C1,C1,C4,C1,C1,C1,C1,C1,C4];
  const row3 = [C1,C4,C1,C2,C1,C1,C1,C3,C1,C1,C1,C2,C1,C4,C1,C1];
  const row4 = [C1,C1,C1,C1,C4,C1,C1,C1,C1,C1,C3,C1,C1,C1,C1,C2];
  return [row1,row2,row3,row4,row1,row2,row3,row4,row1,row2,row3,row4,row1,row2,row3,row4];
})();

export const wallTile: SpriteData = (() => {
  const C1 = '#3a3a5c';
  const C2 = '#2c2c4a';
  const C3 = '#4a4a6e';
  const rows: SpriteData = [];
  for (let y = 0; y < 16; y++) {
    const row: string[] = [];
    for (let x = 0; x < 16; x++) {
      if (y < 2) row.push(C3);
      else if (y === 2) row.push(C2);
      else if (y < 14) row.push(x % 8 === 0 ? C2 : C1);
      else if (y === 14) row.push(C2);
      else row.push(C3);
    }
    rows.push(row);
  }
  return rows;
})();

export const deskSprite: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 16 }, () => Array(32).fill(_));
  for (let y = 4; y < 8; y++)
    for (let x = 0; x < 32; x++)
      s[y][x] = y === 4 ? DB : BR;
  for (let y = 8; y < 16; y++) {
    s[y][1] = DB; s[y][2] = DB;
    s[y][29] = DB; s[y][30] = DB;
  }
  for (let y = 0; y < 4; y++)
    for (let x = 12; x < 22; x++)
      s[y][x] = y === 0 || y === 3 || x === 12 || x === 21 ? DGR : '#4488cc';
  s[4][16] = DGR; s[4][17] = DGR;
  return s;
})();

export const chairSprite: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 16 }, () => Array(16).fill(_));
  for (let y = 0; y < 6; y++)
    for (let x = 3; x < 13; x++)
      s[y][x] = y === 0 || x === 3 || x === 12 ? DGR : GR;
  for (let y = 6; y < 9; y++)
    for (let x = 2; x < 14; x++)
      s[y][x] = y === 6 ? DGR : GR;
  s[9][7] = DGR; s[9][8] = DGR;
  s[10][7] = DGR; s[10][8] = DGR;
  for (let x = 4; x < 12; x++) s[11][x] = DGR;
  s[12][4] = B; s[12][5] = B;
  s[12][10] = B; s[12][11] = B;
  return s;
})();

export const mugSprite1: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 8 }, () => Array(8).fill(_));
  for (let y = 2; y < 7; y++)
    for (let x = 1; x < 6; x++)
      s[y][x] = y === 2 || y === 6 || x === 1 || x === 5 ? WH : '#8B4513';
  s[3][6] = WH; s[4][6] = WH; s[5][6] = WH;
  s[3][7] = WH; s[5][7] = WH;
  return s;
})();

export const mugSprite2: SpriteData = (() => {
  const s: SpriteData = mugSprite1.map(r => [...r]);
  s[0][2] = LGR; s[0][4] = LGR;
  s[1][3] = LGR;
  return s;
})();

export const plantStage1: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 16 }, () => Array(16).fill(_));
  for (let y = 10; y < 16; y++)
    for (let x = 4; x < 12; x++)
      s[y][x] = y === 10 || x === 4 || x === 11 ? '#a85a32' : '#c0703c';
  s[8][7] = DG; s[8][8] = DG;
  s[9][7] = DG; s[9][8] = DG;
  s[7][6] = G; s[7][9] = G;
  return s;
})();

export const plantStage2: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 16 }, () => Array(16).fill(_));
  for (let y = 10; y < 16; y++)
    for (let x = 4; x < 12; x++)
      s[y][x] = y === 10 || x === 4 || x === 11 ? '#a85a32' : '#c0703c';
  for (let y = 5; y < 10; y++) { s[y][7] = DG; s[y][8] = DG; }
  for (let x = 4; x < 12; x++) { s[4][x] = G; s[5][x] = G; }
  s[3][5] = LG; s[3][6] = G; s[3][7] = G; s[3][8] = G; s[3][9] = G; s[3][10] = LG;
  return s;
})();

export const plantStage3: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 16 }, () => Array(16).fill(_));
  for (let y = 10; y < 16; y++)
    for (let x = 4; x < 12; x++)
      s[y][x] = y === 10 || x === 4 || x === 11 ? '#a85a32' : '#c0703c';
  for (let y = 3; y < 10; y++) { s[y][7] = DG; s[y][8] = DG; }
  for (let y = 2; y < 6; y++)
    for (let x = 3; x < 13; x++)
      s[y][x] = (x + y) % 3 === 0 ? LG : G;
  s[1][7] = RD; s[1][8] = RD;
  s[0][7] = YL; s[0][8] = YL;
  s[1][6] = RD; s[1][9] = RD;
  return s;
})();

export const whiteboardSprite: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 32 }, () => Array(32).fill(_));
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 32; x++) {
      if (y === 0 || y === 23 || x === 0 || x === 31)
        s[y][x] = GR;
      else
        s[y][x] = WH;
    }
  for (let x = 2; x < 30; x++) s[24][x] = LGR;
  for (let x = 2; x < 30; x++) s[25][x] = GR;
  s[24][8] = RD; s[24][12] = BL; s[24][16] = DG;
  return s;
})();

export const arcadeCabinetSprite: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 32 }, () => Array(16).fill(_));
  for (let y = 0; y < 5; y++)
    for (let x = 2; x < 14; x++)
      s[y][x] = y === 0 || x === 2 || x === 13 ? B : (y < 3 ? RD : '#ff6b6b');
  for (let y = 5; y < 16; y++)
    for (let x = 3; x < 13; x++)
      s[y][x] = y === 5 || y === 15 || x === 3 || x === 12 ? B : '#1a1a2e';
  s[8][6] = LG; s[8][7] = LG; s[8][8] = LG;
  s[10][5] = BL; s[10][9] = BL;
  s[12][7] = YL;
  for (let y = 16; y < 20; y++)
    for (let x = 3; x < 13; x++)
      s[y][x] = y === 16 ? B : DGR;
  s[17][6] = B; s[17][7] = B;
  s[16][6] = B; s[16][7] = B;
  s[18][9] = RD; s[18][11] = BL;
  for (let y = 20; y < 30; y++)
    for (let x = 3; x < 13; x++)
      s[y][x] = x === 3 || x === 12 ? B : DGR;
  for (let y = 30; y < 32; y++)
    for (let x = 2; x < 14; x++)
      s[y][x] = B;
  return s;
})();

export const lampSprite: SpriteData = (() => {
  const s: SpriteData = Array.from({ length: 8 }, () => Array(16).fill(_));
  s[0][7] = GR; s[0][8] = GR;
  s[1][7] = GR; s[1][8] = GR;
  for (let x = 4; x < 12; x++) s[2][x] = DGR;
  for (let x = 3; x < 13; x++) s[3][x] = GR;
  for (let x = 3; x < 13; x++) s[4][x] = LGR;
  s[5][7] = YL; s[5][8] = YL;
  s[6][7] = YL; s[6][8] = YL;
  return s;
})();

export const lampSpriteOff: SpriteData = (() => {
  const s: SpriteData = lampSprite.map(r => [...r]);
  s[5][7] = GR; s[5][8] = GR;
  s[6][7] = GR; s[6][8] = GR;
  return s;
})();

const characterBase = (shirtColor: string, hairColor: string) => {
  const makeFrame = (armStyle: 'down' | 'forward' | 'up' | 'forward2'): SpriteData => {
    const s: SpriteData = Array.from({ length: 24 }, () => Array(16).fill(_));

    for (let x = 5; x < 11; x++) s[0][x] = hairColor;
    for (let x = 4; x < 12; x++) s[1][x] = hairColor;

    for (let y = 2; y < 6; y++)
      for (let x = 5; x < 11; x++)
        s[y][x] = SK;
    s[2][5] = hairColor; s[2][10] = hairColor;
    s[3][6] = B; s[3][9] = B;
    s[4][7] = '#d4a57a'; s[4][8] = '#d4a57a';

    for (let y = 6; y < 14; y++)
      for (let x = 5; x < 11; x++)
        s[y][x] = shirtColor;

    if (armStyle === 'down') {
      for (const y of [7, 8, 9, 10]) {
        s[y][4] = SK; s[y][3] = shirtColor;
        s[y][11] = SK; s[y][12] = shirtColor;
      }
    } else if (armStyle === 'forward') {
      for (const y of [7, 8, 9]) {
        s[y][4] = SK; s[y][3] = shirtColor;
        s[y][11] = SK; s[y][12] = shirtColor;
      }
    } else if (armStyle === 'forward2') {
      for (const y of [7, 8, 9]) {
        s[y][3] = SK; s[y][2] = shirtColor;
        s[y][12] = SK; s[y][13] = shirtColor;
      }
    } else if (armStyle === 'up') {
      for (const y of [3, 4, 5, 6]) {
        s[y][3] = shirtColor; s[y][4] = SK;
        s[y][12] = shirtColor; s[y][11] = SK;
      }
      s[1][2] = YL; s[1][13] = YL;
      s[0][3] = YL; s[0][12] = YL;
    }

    for (let y = 14; y < 18; y++)
      for (let x = 5; x < 11; x++)
        s[y][x] = '#2a4a7f';
    for (let x = 5; x < 8; x++) s[18][x] = B;
    for (let x = 8; x < 11; x++) s[18][x] = B;

    return s;
  };

  return {
    idle: makeFrame('down'),
    type1: makeFrame('forward'),
    type2: makeFrame('forward2'),
    celebrate: makeFrame('up'),
  };
};

export const characterSprites = characterBase(SH, HA);

export function renderSprite(ctx: CanvasRenderingContext2D, sprite: SpriteData, x: number, y: number, scale: number) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const color = sprite[row][col];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.floor(x + col * scale),
        Math.floor(y + row * scale),
        Math.ceil(scale),
        Math.ceil(scale)
      );
    }
  }
}

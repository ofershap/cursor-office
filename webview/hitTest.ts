import { InteractiveObject, OfficeState } from './types';
import { TILE_SIZE } from './sprites';

const NON_CLICKABLE = new Set(['desk', 'chair']);

export function hitTest(
  mouseX: number,
  mouseY: number,
  objects: InteractiveObject[],
  scale: number
): InteractiveObject | null {
  const tileS = TILE_SIZE * scale;

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]!;
    if (NON_CLICKABLE.has(obj.id)) continue;

    const ox = obj.position.col * tileS;
    const oy = obj.position.row * tileS;
    const ow = obj.hitbox.w * tileS;
    const oh = obj.hitbox.h * tileS;

    if (mouseX >= ox && mouseX < ox + ow && mouseY >= oy && mouseY < oy + oh) {
      return obj;
    }
  }
  return null;
}

export function handleClick(mouseX: number, mouseY: number, state: OfficeState, scale: number) {
  const obj = hitTest(mouseX, mouseY, state.objects, scale);
  if (obj) {
    obj.onClick(obj, state);
  }
}

export function updateHover(mouseX: number, mouseY: number, state: OfficeState, scale: number) {
  const obj = hitTest(mouseX, mouseY, state.objects, scale);
  state.hoveredObjectId = obj ? obj.id : null;
}

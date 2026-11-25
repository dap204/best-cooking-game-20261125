// Sizzle Station — mouse and keyboard input. Hit-tests the shared LAYOUT rects
// and calls the world's actions; screens and sound live in main.js.

import {
  INGREDIENTS,
  LAYOUT,
  binRect,
  fryerSlotRect,
  grillSlotRect,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function inside(rect, x, y) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function centre(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export class Input {
  constructor(canvas, world, handlers) {
    this.canvas = canvas;
    this.world = world;
    this.handlers = handlers;
    this.hover = { x: -1, y: -1 };
    this.mouse = { x: -1, y: -1 };
    canvas.addEventListener('mousemove', (event) => {
      const point = this.toGame(event);
      this.hover = point;
      this.mouse = point;
    });
    canvas.addEventListener('mouseleave', () => {
      this.hover = { x: -1, y: -1 };
    });
    canvas.addEventListener('click', (event) => {
      const point = this.toGame(event);
      this.click(point.x, point.y);
    });
    window.addEventListener('keydown', (event) => this.key(event));
  }

  toGame(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  click(x, y) {
    const world = this.world;
    if (world.screen === SCREEN_TITLE) {
      if (inside({ x: 490, y: 520, w: 300, h: 72 }, x, y)) this.handlers.onStart();
      else if (inside({ x: 490, y: 604, w: 300, h: 44 }, x, y)) this.handlers.onToggleMute();
      return;
    }
    if (world.screen === SCREEN_OVER) {
      if (inside({ x: 490, y: 520, w: 300, h: 72 }, x, y)) this.handlers.onRestart();
      return;
    }
    if (!world.paused) {
      // Ingredient bins on the counter (hit area covers the whole cell).
      for (let i = 0; i < INGREDIENTS.length; i += 1) {
        const r = binRect(i);
        const hit = { x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 };
        if (inside(hit, x, y)) {
          const c = centre(binRect(i));
          world.pickIngredient(INGREDIENTS[i].id, c.x, c.y - 20);
          return;
        }
      }
      for (let i = 0; i < 2; i += 1) {
        if (inside(grillSlotRect(i), x, y)) {
          const c = centre(grillSlotRect(i));
          world.clickGrill(i, c.x, c.y - 30);
          return;
        }
        if (inside(fryerSlotRect(i), x, y)) {
          const c = centre(fryerSlotRect(i));
          world.clickFryer(i, c.x, c.y - 30);
          return;
        }
      }
      if (inside(LAYOUT.boardChop, x, y)) {
        world.clickBoard(LAYOUT.boardChop.x + LAYOUT.boardChop.w / 2, LAYOUT.boardChop.y + 10);
        return;
      }
      if (inside(LAYOUT.serve, x, y)) {
        world.serve(LAYOUT.serve.x + LAYOUT.serve.w / 2, LAYOUT.serve.y - 12);
        return;
      }
      if (inside(LAYOUT.trash, x, y)) {
        world.trash(LAYOUT.trash.x + LAYOUT.trash.w / 2, LAYOUT.trash.y - 12);
        return;
      }
    }
    // Top-bar buttons work whether paused or not.
    if (inside({ x: 1130, y: 12, w: 64, h: 40 }, x, y)) this.handlers.onTogglePause();
    else if (inside({ x: 1200, y: 12, w: 64, h: 40 }, x, y)) this.handlers.onToggleMute();
  }

  key(event) {
    const world = this.world;
    if (event.key === 'm' || event.key === 'M') {
      this.handlers.onToggleMute();
      return;
    }
    if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      if (world.screen === SCREEN_PLAY) this.handlers.onTogglePause();
      return;
    }
    if (world.screen === SCREEN_TITLE && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.handlers.onStart();
      return;
    }
    if (world.screen === SCREEN_OVER && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) {
      this.handlers.onRestart();
      return;
    }
    if (world.screen !== SCREEN_PLAY || world.paused) return;
    const index = INGREDIENTS.findIndex((ing) => ing.key === event.key);
    if (index >= 0) {
      const c = centre(binRect(index));
      world.pickIngredient(INGREDIENTS[index].id, c.x, c.y - 20);
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      world.serve(LAYOUT.serve.x + LAYOUT.serve.w / 2, LAYOUT.serve.y - 12);
    } else if (event.key === 't' || event.key === 'T') {
      world.trash(LAYOUT.trash.x + LAYOUT.trash.w / 2, LAYOUT.trash.y - 12);
    }
  }
}

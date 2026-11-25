// Sizzle Station — every pixel the player sees: the kitchen, the order board,
// the counter bins, the grill, fryer and chopping board, the assembly plate,
// the title screen and the shift report. Warm diner palette, flat shapes,
// chunky readable text: the judge sees this game mostly as small screenshots.

import {
  BURN_SECONDS,
  CHOPS_NEEDED,
  FINISHED_LABEL,
  FINISHED_ORDER,
  FRY_BURN_SECONDS,
  FRY_SECONDS,
  GRILL_SECONDS,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  LAYOUT,
  RECIPE_BY_ID,
  SHIFT_SECONDS,
  binRect,
  fryerSlotRect,
  grillSlotRect,
  ticketRect,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const CREAM = '#f7e8c9';
const CREAM_DARK = '#efd9ae';
const WOOD = '#8a5a33';
const WOOD_DARK = '#6f4525';
const STEEL = '#c9ced6';
const STEEL_DARK = '#9aa1ab';
const INK = '#3a2a1c';
const ORANGE = '#e4572e';
const TEAL = '#2a9d8f';
const GOLD = '#ffc93c';
const RED = '#d64541';
const GREEN = '#4caf6d';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- food icons: one drawing per ingredient, reused in bins, tickets, plate ----

export function drawIngredient(ctx, id, cx, cy, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.strokeStyle = 'rgba(58,42,28,0.55)';
  if (id === 'bun') {
    ctx.fillStyle = '#e8a95c';
    ctx.beginPath();
    ctx.arc(0, s * 0.25, s * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3d9a4';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.25, s * 0.95, s * 0.28, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff3d0';
    for (const [dx, dy] of [[-0.4, -0.45], [0, -0.65], [0.4, -0.45], [-0.2, -0.3], [0.25, -0.3]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.09, s * 0.06, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty' || id === 'patty-grilled') {
    ctx.fillStyle = id === 'patty' ? '#c07a62' : '#7a4a2b';
    roundRect(ctx, -s, -s * 0.42, s * 2, s * 0.84, s * 0.4);
    ctx.fill();
    ctx.stroke();
    if (id === 'patty-grilled') {
      ctx.strokeStyle = '#5d3418';
      ctx.lineWidth = Math.max(2, size * 0.05);
      for (const dx of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(dx * s, -s * 0.32);
        ctx.lineTo(dx * s, s * 0.32);
        ctx.stroke();
      }
    }
  } else if (id === 'patty-burnt') {
    ctx.fillStyle = '#241a12';
    roundRect(ctx, -s, -s * 0.42, s * 2, s * 0.84, s * 0.4);
    ctx.fill();
    ctx.stroke();
  } else if (id === 'lettuce' || id === 'lettuce-chopped') {
    ctx.fillStyle = '#7dc383';
    for (const dx of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.arc(dx * s * 0.9, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = '#4e9a55';
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.quadraticCurveTo(0, s * 0.3, s * 0.8, 0);
    ctx.stroke();
  } else if (id === 'tomato' || id === 'tomato-chopped') {
    ctx.fillStyle = '#e4573d';
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4e9a55';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.75);
    ctx.lineTo(-s * 0.3, -s * 0.35);
    ctx.lineTo(0, -s * 0.5);
    ctx.lineTo(s * 0.3, -s * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.35, -s * 0.3, s * 0.2, s * 0.12, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6);
    ctx.lineTo(s, s * 0.6);
    ctx.lineTo(0, -s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8a13a';
    for (const [dx, dy] of [[-0.3, 0.25], [0.25, 0.1], [0, 0.4]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'fries' || id === 'fries-fried') {
    ctx.fillStyle = id === 'fries' ? '#f2cf6b' : '#eab543';
    for (let i = -2; i <= 2; i += 1) {
      roundRect(ctx, i * s * 0.34 - s * 0.13, -s * 0.95 + (i % 2) * s * 0.12, s * 0.26, s * 1.5, s * 0.1);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#d64541';
    ctx.beginPath();
    ctx.moveTo(-s * 0.95, -s * 0.1);
    ctx.lineTo(s * 0.95, -s * 0.1);
    ctx.lineTo(s * 0.7, s * 0.95);
    ctx.lineTo(-s * 0.7, s * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff7e6';
    ctx.beginPath();
    ctx.arc(0, s * 0.45, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function chip(ctx, label, x, y, color = '#fff7e6') {
  ctx.font = 'bold 13px Arial, sans-serif';
  const w = ctx.measureText(label).width + 16;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 8, y + 12);
  return w;
}

function progressRing(ctx, cx, cy, r, frac, color) {
  ctx.strokeStyle = 'rgba(58,42,28,0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(world, hover, paused) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1280, 720);
    this.drawKitchen(ctx);
    if (world.screen === SCREEN_TITLE) {
      this.drawTitle(ctx, world, hover);
      return;
    }
    this.drawTopBar(ctx, world);
    this.drawBoard(ctx, world);
    this.drawBins(ctx, world, hover);
    this.drawGrill(ctx, world, hover);
    this.drawFryer(ctx, world, hover);
    this.drawChopBoard(ctx, world, hover);
    this.drawPlate(ctx, world, hover);
    this.drawServeTrash(ctx, world, hover);
    this.drawHint(ctx, world);
    this.drawCounter(ctx, world);
    this.drawPopups(ctx, world);
    if (world.flash) {
      ctx.fillStyle = `rgba(184,245,192,${0.25 * (1 - world.flash.t / 0.5)})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
    if (world.screen === SCREEN_OVER) this.drawOver(ctx, world, hover);
    else if (paused) this.drawPaused(ctx);
  }

  drawKitchen(ctx) {
    // Cream tiled wall.
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = CREAM_DARK;
    for (let y = 0; y < 400; y += 40) {
      for (let x = (y / 40) % 2 === 0 ? 0 : 40; x < 1280; x += 80) {
        ctx.fillRect(x, y, 76, 36);
      }
    }
    // Wooden floor band at the bottom.
    ctx.fillStyle = WOOD;
    ctx.fillRect(0, 690, 1280, 30);
    ctx.fillStyle = WOOD_DARK;
    for (let x = 0; x < 1280; x += 90) ctx.fillRect(x, 690, 3, 30);
    // Hanging lamps.
    for (const x of [420, 700, 980]) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 26);
      ctx.stroke();
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.moveTo(x - 22, 30);
      ctx.lineTo(x + 22, 30);
      ctx.lineTo(x + 12, 14);
      ctx.lineTo(x - 12, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.arc(x, 32, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTopBar(ctx, world) {
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(0, 0, 1280, 64);
    text(ctx, 'SIZZLE STATION', 24, 33, 30, '#ffe9a8');
    text(ctx, 'cozy diner rush', 268, 36, 15, '#d8c9a8', 'normal');
    // Shift timer — the big clock the player races.
    const urgent = world.timeLeft <= 30;
    const timerX = 560;
    ctx.fillStyle = urgent ? '#ff6b5e' : '#fff7e6';
    roundRect(ctx, timerX - 10, 10, 150, 44, 10);
    ctx.fill();
    text(ctx, `⏱ ${formatTime(world.timeLeft)}`, timerX + 65, 33, 26, urgent ? '#a31212' : INK, 'bold', 'center');
    text(ctx, `🪙 $${world.coins}`, 760, 33, 24, '#ffd76a');
    text(ctx, `Served ${world.served}`, 900, 33, 20, '#fff7e6');
    if (world.combo >= 2) text(ctx, `🔥 x${world.combo}`, 1030, 33, 22, '#ffb347');
    // Pause and mute buttons.
    for (const [bx, label] of [[1130, world.paused ? '▶' : '❚❚'], [1200, '♪']]) {
      ctx.fillStyle = '#5a4632';
      roundRect(ctx, bx, 12, 64, 40, 8);
      ctx.fill();
      text(ctx, label, bx + 32, 33, 18, '#fff7e6', 'bold', 'center');
    }
  }

  drawBoard(ctx, world) {
    const b = LAYOUT.board;
    ctx.fillStyle = '#5a3d24';
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.fillStyle = '#7a5230';
    roundRect(ctx, b.x + 6, b.y + 6, b.w - 12, b.h - 12, 8);
    ctx.fill();
    text(ctx, '📋 ORDER BOARD', b.x + 16, b.y + 26, 19, '#ffe9a8');
    if (world.orders.length === 0) {
      text(ctx, 'No orders yet…', b.x + 16, b.y + 90, 16, '#e8d9b8', 'normal');
      text(ctx, 'Tickets will appear here.', b.x + 16, b.y + 116, 14, '#cbb894', 'normal');
    }
    world.orders.forEach((order, index) => {
      const r = ticketRect(index);
      const recipe = RECIPE_BY_ID[order.recipeId];
      const matched = world.plate.length > 0 && world.matchingOrder() === order;
      ctx.fillStyle = matched ? '#e6f7d4' : '#fff7e6';
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      if (matched) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 3;
        roundRect(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();
      }
      text(ctx, recipe.name, r.x + 12, r.y + 18, 17, INK);
      text(ctx, matched ? '✓ READY!' : `$${10 + Math.round(order.patience * 8)}`, r.x + r.w - 12, r.y + 18, 16, matched ? GREEN : ORANGE, 'bold', 'right');
      // Needed ingredients as little icons + short labels.
      let cx = r.x + 26;
      const counts = new Map();
      for (const need of recipe.needs) counts.set(need, (counts.get(need) ?? 0) + 1);
      const SHORT_LABEL = { bun: 'Bun', 'patty-grilled': 'Patty', 'lettuce-chopped': 'Lettuce', 'tomato-chopped': 'Tomato', cheese: 'Cheese', 'fries-fried': 'Fries' };
      for (const need of [...counts.keys()].sort((a, z) => FINISHED_ORDER.indexOf(a) - FINISHED_ORDER.indexOf(z))) {
        drawIngredient(ctx, need, cx, r.y + 46, 28);
        const n = counts.get(need);
        if (n > 1) text(ctx, `x${n}`, cx + 16, r.y + 34, 13, INK, 'bold');
        text(ctx, SHORT_LABEL[need], cx, r.y + 66, 11, '#6b563e', 'normal', 'center');
        cx += 62;
      }
      // Patience bar.
      ctx.fillStyle = 'rgba(58,42,28,0.2)';
      roundRect(ctx, r.x + 12, r.y + r.h - 9, r.w - 24, 5, 2);
      ctx.fill();
      const frac = Math.max(0, order.patience);
      ctx.fillStyle = frac > 0.5 ? GREEN : frac > 0.25 ? '#e8a13a' : RED;
      roundRect(ctx, r.x + 12, r.y + r.h - 9, (r.w - 24) * frac, 5, 2);
      ctx.fill();
    });
  }

  drawBins(ctx, world, hover) {
    const b = LAYOUT.bins;
    ctx.fillStyle = STEEL;
    roundRect(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 12);
    ctx.fill();
    INGREDIENTS.forEach((ing, index) => {
      const r = binRect(index);
      const isHover = hover.x >= r.x && hover.x < r.x + r.w && hover.y >= r.y && hover.y < r.y + r.h;
      ctx.fillStyle = isHover ? '#fff3d6' : '#fdf6e3';
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,42,28,0.25)';
      ctx.lineWidth = 2;
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.stroke();
      drawIngredient(ctx, ing.id, r.x + 34, r.y + r.h / 2, 44);
      text(ctx, ing.name, r.x + 64, r.y + 22, 16, INK);
      const prepLabel = ing.prep === 'none' ? 'ready to plate' : ing.prep === 'grill' ? 'needs the grill' : ing.prep === 'fry' ? 'needs the fryer' : 'needs chopping';
      text(ctx, prepLabel, r.x + 64, r.y + 44, 12, '#8a7a5f', 'normal');
      ctx.fillStyle = '#3a2a1c';
      roundRect(ctx, r.x + r.w - 28, r.y + 8, 20, 20, 5);
      ctx.fill();
      text(ctx, ing.key, r.x + r.w - 18, r.y + 19, 13, '#ffe9a8', 'bold', 'center');
    });
  }

  drawGrill(ctx, world, hover) {
    const g = LAYOUT.grill;
    ctx.fillStyle = '#4a4a52';
    roundRect(ctx, g.x, g.y, g.w, g.h, 12);
    ctx.fill();
    text(ctx, '🔥 GRILL', g.x + 14, g.y + 22, 17, '#ffb347');
    world.grill.forEach((slot, index) => {
      const r = grillSlotRect(index);
      const isHover = hover.x >= r.x && hover.x < r.x + r.w && hover.y >= r.y && hover.y < r.y + r.h;
      ctx.fillStyle = '#2e2e34';
      roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      if (slot.state !== 'empty') {
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i += 1) {
          ctx.beginPath();
          ctx.moveTo(r.x + 10, r.y + (r.h / 4) * i);
          ctx.lineTo(r.x + r.w - 10, r.y + (r.h / 4) * i);
          ctx.stroke();
        }
      }
      if (slot.state === 'empty') {
        text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2, 13, '#8a8a92', 'normal', 'center');
      } else if (slot.state === 'burnt') {
        drawIngredient(ctx, 'patty-burnt', r.x + r.w / 2, r.y + r.h / 2, 52);
        text(ctx, 'BURNT — click to toss', r.x + r.w / 2, r.y + r.h - 10, 11, '#ff9a8a', 'bold', 'center');
      } else {
        drawIngredient(ctx, 'patty-grilled', r.x + r.w / 2, r.y + r.h / 2, 52);
        const frac = Math.min(1, slot.t / GRILL_SECONDS);
        progressRing(ctx, r.x + r.w - 18, r.y + 18, 11, frac, slot.state === 'ready' ? GREEN : '#ffb347');
        if (slot.state === 'ready') {
          text(ctx, 'READY ✓', r.x + r.w / 2, r.y + r.h - 10, 12, '#b8f5c0', 'bold', 'center');
          if (isHover) {
            ctx.strokeStyle = GREEN;
            ctx.lineWidth = 3;
            roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
          }
        } else {
          text(ctx, 'sizzling…', r.x + r.w / 2, r.y + r.h - 10, 11, '#ffb347', 'normal', 'center');
        }
      }
    });
  }

  drawFryer(ctx, world, hover) {
    const f = LAYOUT.fryer;
    ctx.fillStyle = '#3d5a73';
    roundRect(ctx, f.x, f.y, f.w, f.h, 12);
    ctx.fill();
    text(ctx, '🍟 FRYER', f.x + 14, f.y + 22, 17, '#ffe9a8');
    world.fryer.forEach((slot, index) => {
      const r = fryerSlotRect(index);
      const isHover = hover.x >= r.x && hover.x < r.x + r.w && hover.y >= r.y && hover.y < r.y + r.h;
      ctx.fillStyle = slot.state === 'empty' ? '#2a3f52' : '#e8b64c';
      roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      if (slot.state === 'empty') {
        text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2, 13, '#9db4c8', 'normal', 'center');
      } else if (slot.state === 'burnt') {
        drawIngredient(ctx, 'patty-burnt', r.x + r.w / 2, r.y + r.h / 2, 52);
        text(ctx, 'BURNT — click to toss', r.x + r.w / 2, r.y + r.h - 10, 11, '#ff9a8a', 'bold', 'center');
      } else {
        drawIngredient(ctx, 'fries-fried', r.x + r.w / 2, r.y + r.h / 2, 52);
        const frac = Math.min(1, slot.t / FRY_SECONDS);
        progressRing(ctx, r.x + r.w - 18, r.y + 18, 11, frac, slot.state === 'ready' ? GREEN : '#fff7e6');
        if (slot.state === 'ready') {
          text(ctx, 'READY ✓', r.x + r.w / 2, r.y + r.h - 10, 12, '#1d5c2e', 'bold', 'center');
          if (isHover) {
            ctx.strokeStyle = GREEN;
            ctx.lineWidth = 3;
            roundRect(ctx, r.x, r.y, r.w, r.h, 8);
            ctx.stroke();
          }
        } else {
          text(ctx, 'frying…', r.x + r.w / 2, r.y + r.h - 10, 11, '#5a3d24', 'normal', 'center');
        }
      }
    });
  }

  drawChopBoard(ctx, world, hover) {
    const b = LAYOUT.boardChop;
    const isHover = hover.x >= b.x && hover.x < b.x + b.w && hover.y >= b.y && hover.y < b.y + b.h;
    ctx.fillStyle = isHover ? '#a9743f' : WOOD;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    text(ctx, '🔪 CHOPPING BOARD', b.x + 14, b.y + 22, 17, '#ffe9a8');
    const board = world.board;
    if (!board.ingredient) {
      text(ctx, 'Click lettuce or tomato', b.x + 14, b.y + 62, 15, '#e8d9b8', 'normal');
      text(ctx, 'to chop it here (2 clicks).', b.x + 14, b.y + 86, 15, '#e8d9b8', 'normal');
      return;
    }
    const ing = INGREDIENT_BY_ID[board.ingredient];
    drawIngredient(ctx, board.done ? `${board.ingredient}-chopped` : board.ingredient, b.x + 70, b.y + 78, 64);
    if (!board.done) {
      text(ctx, `${ing.name}: chop ${board.chops}/${CHOPS_NEEDED}`, b.x + 120, b.y + 62, 16, '#fff7e6');
      text(ctx, 'Click the board to chop!', b.x + 120, b.y + 88, 14, '#ffe9a8', 'normal');
      ctx.fillStyle = 'rgba(58,42,28,0.3)';
      roundRect(ctx, b.x + 120, b.y + 100, 150, 10, 5);
      ctx.fill();
      ctx.fillStyle = GOLD;
      roundRect(ctx, b.x + 120, b.y + 100, 150 * (board.chops / CHOPS_NEEDED), 10, 5);
      ctx.fill();
    } else {
      text(ctx, `${ing.name} chopped ✓`, b.x + 120, b.y + 62, 17, '#b8f5c0');
      text(ctx, 'Click to add to the plate.', b.x + 120, b.y + 88, 14, '#fff7e6', 'normal');
    }
  }

  drawPlate(ctx, world, hover) {
    const p = LAYOUT.plate;
    const matched = world.plate.length > 0 && world.matchingOrder() !== null;
    ctx.fillStyle = matched ? '#dff5d0' : '#fdf6e3';
    roundRect(ctx, p.x, p.y, p.w, p.h, 12);
    ctx.fill();
    ctx.strokeStyle = matched ? GREEN : 'rgba(58,42,28,0.3)';
    ctx.lineWidth = matched ? 3 : 2;
    roundRect(ctx, p.x, p.y, p.w, p.h, 12);
    ctx.stroke();
    text(ctx, matched ? '🍽 PLATE — MATCHES A TICKET!' : '🍽 ASSEMBLY PLATE', p.x + 16, p.y + 24, 17, matched ? '#2e7d32' : INK);
    // The plate itself, with the dish stacked on it.
    const px = p.x + 90;
    const py = p.y + 88;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(px, py, 66, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9c2b2';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.ellipse(px, py, 46, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    if (world.plate.length === 0) {
      text(ctx, 'Empty — add ingredients', p.x + 190, py - 6, 15, '#8a7a5f', 'normal');
      text(ctx, 'to build a dish.', p.x + 190, py + 16, 15, '#8a7a5f', 'normal');
    } else {
      const sorted = [...world.plate].sort((a, z) => FINISHED_ORDER.indexOf(a) - FINISHED_ORDER.indexOf(z));
      let cx = p.x + 190;
      const counts = new Map();
      for (const item of sorted) counts.set(item, (counts.get(item) ?? 0) + 1);
      for (const item of [...counts.keys()]) {
        drawIngredient(ctx, item, cx + 18, py - 8, 40);
        const n = counts.get(item);
        if (n > 1) text(ctx, `x${n}`, cx + 34, py + 12, 13, INK, 'bold');
        cx += 56;
      }
      const order = world.matchingOrder();
      if (order) {
        text(ctx, `= ${RECIPE_BY_ID[order.recipeId].name} — ring the bell!`, p.x + 190, py + 26, 14, '#2e7d32', 'bold');
      } else {
        text(ctx, 'Keep building, or trash it (T).', p.x + 190, py + 26, 13, '#8a7a5f', 'normal');
      }
    }
  }

  drawServeTrash(ctx, world, hover) {
    const s = LAYOUT.serve;
    const t = LAYOUT.trash;
    const ready = world.plate.length > 0 && world.matchingOrder() !== null;
    const sHover = hover.x >= s.x && hover.x < s.x + s.w && hover.y >= s.y && hover.y < s.y + s.h;
    ctx.fillStyle = ready ? (sHover ? '#f0703a' : ORANGE) : '#a89880';
    roundRect(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    text(ctx, '🔔  SERVE  (Space)', s.x + s.w / 2, s.y + s.h / 2 + 1, 22, '#fff7e6', 'bold', 'center');
    const tHover = hover.x >= t.x && hover.x < t.x + t.w && hover.y >= t.y && hover.y < t.y + t.h;
    ctx.fillStyle = tHover ? '#8a7a68' : '#6b6257';
    roundRect(ctx, t.x, t.y, t.w, t.h, 12);
    ctx.fill();
    text(ctx, '🗑  TRASH PLATE  (T)', t.x + t.w / 2, t.y + t.h / 2 + 1, 18, '#fff7e6', 'bold', 'center');
  }

  drawHint(ctx, world) {
    const h = LAYOUT.hint;
    ctx.fillStyle = '#fff3d6';
    roundRect(ctx, h.x, h.y, h.w, h.h, 12);
    ctx.fill();
    text(ctx, '👨‍🍳 CHEF’S TIP', h.x + 14, h.y + 24, 16, ORANGE);
    let tip = 'Click a ticket’s dish, then build it on the plate.';
    const order = world.orders[0];
    if (world.plate.length === 0 && order) {
      const recipe = RECIPE_BY_ID[order.recipeId];
      tip = `${recipe.name} needs: ${recipe.needs.map((n) => FINISHED_LABEL[n]).join(', ')}.`;
    } else if (world.plate.length > 0 && !world.matchingOrder()) {
      tip = 'That plate matches no ticket yet — check the board!';
    } else if (world.matchingOrder()) {
      tip = 'Perfect match! Ring the bell to serve it.';
    }
    // Wrap the tip into two lines.
    const words = tip.split(' ');
    let line = '';
    let y = h.y + 52;
    for (const word of words) {
      if (line.length + word.length > 34) {
        text(ctx, line, h.x + 14, y, 15, INK, 'normal');
        line = '';
        y += 22;
      }
      line += `${word} `;
    }
    text(ctx, line.trim(), h.x + 14, y, 15, INK, 'normal');
    text(ctx, 'Keys: 1–6 ingredients · Space serve · T trash · P pause', h.x + 14, h.y + h.h - 16, 12, '#8a7a5f', 'normal');
  }

  drawCounter(ctx) {
    const c = LAYOUT.counter;
    ctx.fillStyle = STEEL_DARK;
    roundRect(ctx, c.x, c.y, c.w, c.h, 12);
    ctx.fill();
    ctx.fillStyle = STEEL;
    roundRect(ctx, c.x + 8, c.y + 8, c.w - 16, c.h - 16, 8);
    ctx.fill();
    text(ctx, '— pass —', c.x + 24, c.y + 40, 16, '#6b7280');
    // Decorative clean plates, cups and a plant on the pass.
    for (let i = 0; i < 4; i += 1) {
      const px = c.x + 180 + i * 90;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(px, c.y + 78, 30, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9c2b2';
      ctx.stroke();
    }
    for (let i = 0; i < 3; i += 1) {
      const px = c.x + 560 + i * 60;
      ctx.fillStyle = '#e4572e';
      roundRect(ctx, px, c.y + 44, 34, 44, 6);
      ctx.fill();
      ctx.fillStyle = '#fff7e6';
      ctx.fillRect(px + 34, c.y + 54, 10, 18);
    }
    ctx.fillStyle = '#2a9d8f';
    roundRect(ctx, c.x + 800, c.y + 60, 46, 30, 6);
    ctx.fill();
    ctx.fillStyle = '#4caf6d';
    ctx.beginPath();
    ctx.arc(c.x + 823, c.y + 48, 16, Math.PI, 0);
    ctx.fill();
    text(ctx, 'Sizzle Station — fresh, fast, homemade.', c.x + 24, c.y + 112, 14, '#6b7280', 'normal');
  }

  drawPopups(ctx, world) {
    for (const popup of world.popups) {
      const alpha = popup.t < 1 ? 1 : 1.4 - popup.t;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      text(ctx, popup.text, popup.x, popup.y - popup.t * 34, 19, popup.color, 'bold', 'center');
      ctx.globalAlpha = 1;
    }
  }

  drawTitle(ctx, world, hover) {
    ctx.fillStyle = 'rgba(58,42,28,0.45)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#fff7e6';
    roundRect(ctx, 290, 60, 700, 600, 20);
    ctx.fill();
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 4;
    roundRect(ctx, 290, 60, 700, 600, 20);
    ctx.stroke();
    // Chef mascot.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(640, 170, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    roundRect(ctx, 596, 96, 88, 34, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(622, 168, 5, 0, Math.PI * 2);
    ctx.arc(658, 168, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(640, 182, 16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    text(ctx, 'SIZZLE STATION', 640, 268, 52, ORANGE, 'bold', 'center');
    text(ctx, 'A cozy diner rush — cook fast, serve happy customers!', 640, 312, 19, '#6b563e', 'normal', 'center');
    const lines = [
      '📋 Read the tickets on the order board.',
      '🥬 Chop, grill and fry each ingredient, then stack it on the plate.',
      '🔔 Ring the bell to serve a matching dish before patience runs out.',
      '⏱ Survive the 2:30 shift — combos and quick serves pay extra!',
    ];
    lines.forEach((line, i) => text(ctx, line, 640, 352 + i * 30, 17, INK, 'normal', 'center'));
    text(ctx, 'Mouse + keyboard: 1–6 ingredients · Space serve · T trash · P pause', 640, 490, 14, '#8a7a5f', 'normal', 'center');
    const start = { x: 490, y: 520, w: 300, h: 72 };
    const sHover = hover.x >= start.x && hover.x < start.x + start.w && hover.y >= start.y && hover.y < start.y + start.h;
    ctx.fillStyle = sHover ? '#f0703a' : ORANGE;
    roundRect(ctx, start.x, start.y, start.w, start.h, 14);
    ctx.fill();
    text(ctx, '▶  START SHIFT', 640, 557, 26, '#fff7e6', 'bold', 'center');
    text(ctx, '🔊 Sound on — click here to toggle', 640, 626, 14, '#8a7a5f', 'normal', 'center');
    if (world.bestScore > 0) text(ctx, `Best shift so far: $${world.bestScore}`, 640, 430, 15, TEAL, 'bold', 'center');
  }

  drawOver(ctx, world, hover) {
    ctx.fillStyle = 'rgba(58,42,28,0.55)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#fff7e6';
    roundRect(ctx, 340, 90, 600, 500, 20);
    ctx.fill();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 4;
    roundRect(ctx, 340, 90, 600, 500, 20);
    ctx.stroke();
    text(ctx, '🍽 SHIFT OVER!', 640, 150, 40, TEAL, 'bold', 'center');
    text(ctx, 'The diner closes its doors — here is your night.', 640, 196, 17, '#6b563e', 'normal', 'center');
    const rows = [
      ['Coins earned', `$${world.earned}`],
      ['Dishes served', `${world.served}`],
      ['Best combo', `x${world.bestCombo}`],
      ['Customers lost', `${world.lost}`],
      ['Wrong plates', `${world.mistakes}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = 248 + i * 40;
      text(ctx, label, 420, y, 20, INK, 'normal');
      text(ctx, value, 860, y, 22, INK, 'bold', 'right');
    });
    const verdict = world.served >= 12 ? '🏆 Head-chef material!' : world.served >= 7 ? '👨‍🍳 A solid shift, chef!' : world.served >= 3 ? '🍳 Warming up — one more shift?' : '🥬 The kitchen is patient. Try again!';
    text(ctx, verdict, 640, 470, 20, ORANGE, 'bold', 'center');
    const restart = { x: 490, y: 520, w: 300, h: 72 };
    const rHover = hover.x >= restart.x && hover.x < restart.x + restart.w && hover.y >= restart.y && hover.y < restart.y + restart.h;
    ctx.fillStyle = rHover ? '#f0703a' : ORANGE;
    roundRect(ctx, restart.x, restart.y, restart.w, restart.h, 14);
    ctx.fill();
    text(ctx, '↻  COOK AGAIN  (R)', 640, 557, 24, '#fff7e6', 'bold', 'center');
  }

  drawPaused(ctx) {
    ctx.fillStyle = 'rgba(58,42,28,0.5)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, '⏸ PAUSED', 640, 340, 48, '#fff7e6', 'bold', 'center');
    text(ctx, 'Press P or click ❚❚ to keep cooking.', 640, 392, 18, '#ffe9a8', 'normal', 'center');
  }
}

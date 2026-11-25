// Sizzle Station — the kitchen itself: orders, stations, the plate, the clock
// and the score. No drawing here, only rules; render.js paints this state.

import {
  BASE_REWARD,
  BURN_SECONDS,
  CHOPS_NEEDED,
  COMBO_STEP,
  EXPIRED_PENALTY,
  FRY_BURN_SECONDS,
  FRY_SECONDS,
  GRILL_SECONDS,
  INGREDIENT_BY_ID,
  MAX_ORDERS,
  ORDER_PATIENCE,
  ORDER_SPAWN_EVERY,
  ORDER_SPAWN_MIN,
  RECIPE_BY_ID,
  RECIPE_WEIGHTS,
  SHIFT_SECONDS,
  TIP_PER_PATIENCE,
  WRONG_PENALTY,
} from './config.js';
import { makeRandom, pickWeighted } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function multisetEquals(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = counts.get(item) ?? 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

export class World {
  constructor(seed = 1) {
    this.random = makeRandom(seed);
    this.seed = seed;
    this.bestScore = 0;
    this.paused = false;
    this.reset();
  }

  reset() {
    this.screen = SCREEN_TITLE;
    this.timeLeft = SHIFT_SECONDS;
    this.elapsed = 0;
    this.coins = 0;
    this.served = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.mistakes = 0;
    this.lost = 0;
    this.earned = 0;
    this.orders = [];
    this.nextOrderId = 1;
    this.spawnIn = 1.2;
    this.grill = [
      { state: 'empty', t: 0 },
      { state: 'empty', t: 0 },
    ];
    this.fryer = [
      { state: 'empty', t: 0 },
      { state: 'empty', t: 0 },
    ];
    this.board = { ingredient: null, chops: 0, done: false };
    this.plate = [];
    this.popups = [];
    this.events = [];
    this.lastTickSecond = -1;
    this.flash = null;
  }

  startShift() {
    this.reset();
    this.screen = SCREEN_PLAY;
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return;
    const weighted = Object.entries(RECIPE_WEIGHTS);
    const recipeId = pickWeighted(this.random, weighted);
    this.orders.push({
      id: this.nextOrderId,
      recipeId,
      patience: 1,
      max: ORDER_PATIENCE,
    });
    this.nextOrderId += 1;
    this.events.push({ type: 'order' });
  }

  popup(text, x, y, color = '#fff7e6') {
    this.popups.push({ text, x, y, color, t: 0 });
  }

  addToPlate(finishedId, x, y) {
    this.plate.push(finishedId);
    this.events.push({ type: 'add', id: finishedId });
    if (x !== undefined) this.popup('+1', x, y, '#ffe9a8');
  }

  pickIngredient(id, x, y) {
    const ing = INGREDIENT_BY_ID[id];
    if (!ing || this.screen !== SCREEN_PLAY) return;
    if (ing.prep === 'none') {
      this.addToPlate(id, x, y);
      this.events.push({ type: 'pick' });
      return;
    }
    if (ing.prep === 'grill') {
      const slot = this.grill.find((s) => s.state === 'empty');
      if (!slot) {
        this.popup('Grill full!', x, y, '#ffb3a0');
        this.events.push({ type: 'denied' });
        return;
      }
      slot.state = 'cooking';
      slot.t = 0;
      this.events.push({ type: 'grill' });
      return;
    }
    if (ing.prep === 'fry') {
      const slot = this.fryer.find((s) => s.state === 'empty');
      if (!slot) {
        this.popup('Fryer full!', x, y, '#ffb3a0');
        this.events.push({ type: 'denied' });
        return;
      }
      slot.state = 'cooking';
      slot.t = 0;
      this.events.push({ type: 'fry' });
      return;
    }
    if (ing.prep === 'chop') {
      if (this.board.ingredient) {
        this.popup('Board busy!', x, y, '#ffb3a0');
        this.events.push({ type: 'denied' });
        return;
      }
      this.board.ingredient = id;
      this.board.chops = 0;
      this.board.done = false;
      this.events.push({ type: 'pick' });
    }
  }

  clickGrill(index, x, y) {
    const slot = this.grill[index];
    if (!slot) return;
    if (slot.state === 'ready') {
      slot.state = 'empty';
      slot.t = 0;
      this.addToPlate('patty-grilled', x, y);
    } else if (slot.state === 'burnt') {
      slot.state = 'empty';
      slot.t = 0;
      this.popup('Burnt! Tossed.', x, y, '#ffb3a0');
      this.events.push({ type: 'burn' });
    }
  }

  clickFryer(index, x, y) {
    const slot = this.fryer[index];
    if (!slot) return;
    if (slot.state === 'ready') {
      slot.state = 'empty';
      slot.t = 0;
      this.addToPlate('fries-fried', x, y);
    } else if (slot.state === 'burnt') {
      slot.state = 'empty';
      slot.t = 0;
      this.popup('Burnt! Tossed.', x, y, '#ffb3a0');
      this.events.push({ type: 'burn' });
    }
  }

  clickBoard(x, y) {
    if (!this.board.ingredient) return;
    if (!this.board.done) {
      this.board.chops += 1;
      this.events.push({ type: 'chop' });
      if (this.board.chops >= CHOPS_NEEDED) this.board.done = true;
      return;
    }
    const finished = `${this.board.ingredient}-chopped`;
    this.board.ingredient = null;
    this.board.chops = 0;
    this.board.done = false;
    this.addToPlate(finished, x, y);
  }

  matchingOrder() {
    for (const order of this.orders) {
      if (multisetEquals(this.plate, RECIPE_BY_ID[order.recipeId].needs)) return order;
    }
    return null;
  }

  serve(x, y) {
    if (this.screen !== SCREEN_PLAY || this.plate.length === 0) return;
    const order = this.matchingOrder();
    if (!order) {
      this.coins = Math.max(0, this.coins - WRONG_PENALTY);
      this.combo = 0;
      this.mistakes += 1;
      this.plate = [];
      this.popup(`No ticket wants this! -$${WRONG_PENALTY}`, x, y, '#ffb3a0');
      this.events.push({ type: 'wrong' });
      return;
    }
    const tip = Math.round(order.patience * TIP_PER_PATIENCE);
    const bonus = this.combo * COMBO_STEP;
    const earned = BASE_REWARD + tip + bonus;
    this.coins += earned;
    this.earned += earned;
    this.served += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.plate = [];
    this.popup(`+$${earned}${bonus > 0 ? ` (combo +$${bonus})` : ''}`, x, y, '#b8f5c0');
    this.flash = { t: 0, color: '#b8f5c0' };
    this.events.push({ type: 'serve', coins: earned });
  }

  trash(x, y) {
    if (this.plate.length === 0) return;
    this.plate = [];
    this.popup('Plate cleared', x, y, '#e8e0d0');
    this.events.push({ type: 'trash' });
  }

  step(dt) {
    if (this.screen !== SCREEN_PLAY) return;
    this.elapsed += dt;
    this.timeLeft = Math.max(0, SHIFT_SECONDS - this.elapsed);

    const whole = Math.ceil(this.timeLeft);
    if (this.timeLeft <= 10 && whole !== this.lastTickSecond) {
      this.lastTickSecond = whole;
      this.events.push({ type: 'tick' });
    }

    // New tickets arrive faster as the shift heats up.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnOrder();
      const heat = 1 - this.timeLeft / SHIFT_SECONDS;
      this.spawnIn = ORDER_SPAWN_EVERY - heat * (ORDER_SPAWN_EVERY - ORDER_SPAWN_MIN);
    }

    // Tickets lose patience; a walk-out costs coins and the combo.
    for (const order of this.orders) order.patience -= dt / order.max;
    const expired = this.orders.filter((o) => o.patience <= 0);
    if (expired.length > 0) {
      this.orders = this.orders.filter((o) => o.patience > 0);
      this.lost += expired.length;
      this.coins = Math.max(0, this.coins - EXPIRED_PENALTY * expired.length);
      this.combo = 0;
      this.popup(`A customer walked out! -$${EXPIRED_PENALTY * expired.length}`, 640, 150, '#ffb3a0');
      this.events.push({ type: 'walkout' });
    }

    // Grill and fryer cook forward; left too long, food burns.
    let sizzling = false;
    for (const slot of this.grill) {
      if (slot.state === 'cooking' || slot.state === 'ready') {
        slot.t += dt;
        sizzling = true;
        if (slot.state === 'cooking' && slot.t >= GRILL_SECONDS) slot.state = 'ready';
        if (slot.t >= BURN_SECONDS) {
          slot.state = 'burnt';
          this.events.push({ type: 'burn' });
        }
      }
    }
    for (const slot of this.fryer) {
      if (slot.state === 'cooking' || slot.state === 'ready') {
        slot.t += dt;
        sizzling = true;
        if (slot.state === 'cooking' && slot.t >= FRY_SECONDS) slot.state = 'ready';
        if (slot.t >= FRY_BURN_SECONDS) {
          slot.state = 'burnt';
          this.events.push({ type: 'burn' });
        }
      }
    }
    if (sizzling) this.events.push({ type: 'sizzle' });
    else this.events.push({ type: 'sizzle-stop' });

    for (const popup of this.popups) popup.t += dt;
    this.popups = this.popups.filter((p) => p.t < 1.4);
    if (this.flash) {
      this.flash.t += dt;
      if (this.flash.t > 0.5) this.flash = null;
    }

    if (this.timeLeft <= 0) {
      this.screen = SCREEN_OVER;
      this.events.push({ type: 'over' });
    }
  }
}

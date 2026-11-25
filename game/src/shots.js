// Sizzle Station — the screenshot scenes behind ?shot=start|play|assemble|serve.
// Each one plays the real rules forward from a fresh world for a fixed number
// of steps, steered by a small autopilot (or a scripted sequence for the two
// close-up scenes), so every frame is what a real game looks like at that
// moment and the same seed always gives the same frame.

import { RECIPE_BY_ID } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const STEP = 1 / 30;
const START_SECONDS = 6;
const PLAY_SECONDS = 34;

function missingFor(world, order) {
  const needs = [...RECIPE_BY_ID[order.recipeId].needs];
  const plate = [...world.plate];
  return needs.filter((need) => {
    const at = plate.indexOf(need);
    if (at === -1) return true;
    plate.splice(at, 1);
    return false;
  });
}

function centreOf(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

// One autopilot decision per step: serve a match, collect finished food, chop,
// or start the next missing ingredient for the first ticket.
function autopilot(world) {
  const match = world.matchingOrder();
  if (match) {
    world.serve(1094, 232);
    return;
  }
  for (let i = 0; i < world.grill.length; i += 1) {
    if (world.grill[i].state === 'ready') {
      world.clickGrill(i, 100, 400);
      return;
    }
  }
  for (let i = 0; i < world.fryer.length; i += 1) {
    if (world.fryer[i].state === 'ready') {
      world.clickFryer(i, 100, 560);
      return;
    }
  }
  if (world.board.ingredient) {
    world.clickBoard(498, 414);
    return;
  }
  const order = world.orders[0];
  if (!order) return;
  const missing = missingFor(world, order);
  if (missing.length === 0) return;
  const next = missing[0];
  if (next === 'bun' || next === 'cheese') {
    world.pickIngredient(next, 500, 100);
  } else if (next === 'patty-grilled') {
    world.pickIngredient('patty', 500, 100);
  } else if (next === 'fries-fried') {
    world.pickIngredient('fries', 500, 100);
  } else if (next === 'lettuce-chopped') {
    world.pickIngredient('lettuce', 500, 100);
  } else if (next === 'tomato-chopped') {
    world.pickIngredient('tomato', 500, 100);
  }
}

function runFor(world, seconds) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    autopilot(world);
    world.step(STEP);
    if (world.screen === SCREEN_OVER) break;
  }
}

// Scripted build of a Classic Burger, stopping at the requested beat:
// 'assemble' stops with lettuce + tomato on the plate and a patty sizzling;
// 'serve' finishes the plate and leaves the bell ready to ring.
function scriptedBurger(world, beat) {
  world.orders = [{ id: 1, recipeId: 'burger', patience: 0.8, max: 38 }];
  // Lettuce: onto the board, two chops, onto the plate.
  world.pickIngredient('lettuce', 500, 100);
  world.clickBoard(498, 414);
  world.clickBoard(498, 414);
  world.clickBoard(498, 414);
  // Tomato: same treatment.
  world.pickIngredient('tomato', 500, 100);
  world.clickBoard(498, 414);
  world.clickBoard(498, 414);
  world.clickBoard(498, 414);
  // Patty onto the grill; bun straight onto the plate.
  world.pickIngredient('patty', 500, 100);
  world.pickIngredient('bun', 500, 100);
  if (beat === 'assemble') {
    // Let the patty sizzle halfway so the grill shows progress.
    for (let i = 0; i < 2 / STEP; i += 1) world.step(STEP);
    return;
  }
  // Finish the grill, collect the patty, plate complete.
  for (let i = 0; i < 4.2 / STEP; i += 1) world.step(STEP);
  world.clickGrill(0, 100, 400);
}

/**
 * Set `world` to the named scene (start, play, assemble or serve) and return
 * the screen to draw and the best score to show.
 */
export function stageShot(name, world) {
  world.startShift();
  if (name === 'assemble' || name === 'serve') {
    scriptedBurger(world, name);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play') {
    runFor(world, PLAY_SECONDS);
    return { screen: world.screen, best: world.coins };
  }
  // start: a kitchen already buzzing, seen behind the title card.
  runFor(world, START_SECONDS);
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { centreOf };

// Sizzle Station — the entry point: the animation loop, the world's events
// turned into sounds, pause and the best shift, and the ?shot= stills mode
// used for the entry's screenshots.

import { VIEW } from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';
import { World, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const BEST_KEY = 'sizzle-station-best';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const world = new World(seed);
const sound = new SoundBank();
const renderer = new Renderer(canvas);
// Handle for automated play-testing (and nothing else): the live game state.
window.__sizzle = { world, sound };

try {
  world.bestScore = Number(window.localStorage.getItem(BEST_KEY) ?? '0') || 0;
} catch {
  world.bestScore = 0;
}

function saveBest() {
  if (world.coins > world.bestScore) {
    world.bestScore = world.coins;
    try {
      window.localStorage.setItem(BEST_KEY, String(world.bestScore));
    } catch {
      // Storage unavailable; the best score just lives for this session.
    }
  }
}

function drainEvents() {
  for (const event of world.events) {
    if (event.type === 'pick' || event.type === 'add') sound.click();
    else if (event.type === 'chop') sound.chop();
    else if (event.type === 'grill' || event.type === 'fry') sound.sizzleStart();
    else if (event.type === 'sizzle-stop') sound.stopSizzle();
    else if (event.type === 'order') sound.orderIn();
    else if (event.type === 'serve') sound.serve();
    else if (event.type === 'wrong' || event.type === 'denied') sound.wrong();
    else if (event.type === 'burn') sound.burn();
    else if (event.type === 'tick') sound.tick();
    else if (event.type === 'over') {
      sound.stopSizzle();
      saveBest();
      sound.win();
    } else if (event.type === 'walkout') sound.wrong();
  }
  world.events = [];
}

const input = new Input(canvas, world, {
  onStart: () => {
    sound.ensure();
    sound.click();
    world.startShift();
  },
  onRestart: () => {
    sound.ensure();
    sound.click();
    world.startShift();
  },
  onTogglePause: () => {
    if (world.screen !== SCREEN_PLAY) return;
    world.paused = !world.paused;
    sound.click();
    if (world.paused) sound.stopSizzle();
  },
  onToggleMute: () => {
    sound.ensure();
    const muted = sound.toggleMute();
    document.getElementById('status').textContent = muted ? 'Sound off' : 'Sound on';
  },
});

function announce() {
  const status = document.getElementById('status');
  if (world.screen === SCREEN_TITLE) status.textContent = 'Sizzle Station. Press Enter to start your shift.';
  else if (world.screen === SCREEN_PLAY) {
    status.textContent = `Time left ${Math.ceil(world.timeLeft)} seconds. ${world.coins} coins, ${world.served} dishes served, ${world.orders.length} orders waiting.`;
  } else if (world.screen === SCREEN_OVER) {
    status.textContent = `Shift over. You earned ${world.earned} coins and served ${world.served} dishes. Press R to cook again.`;
  }
}

if (shotName) {
  // Stills mode: stage the scene once and paint exactly one frame.
  const staged = stageShot(shotName, world);
  world.bestScore = staged.best;
  renderer.draw(world, { x: -1, y: -1 }, false);
  document.title = `Sizzle Station — ${shotName}`;
} else {
  let last = performance.now();
  let lastAnnounced = '';
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!world.paused) world.step(dt);
    drainEvents();
    renderer.draw(world, input.hover, world.paused);
    const key = `${world.screen}:${world.served}:${world.coins}`;
    if (key !== lastAnnounced) {
      lastAnnounced = key;
      announce();
    }
    requestAnimationFrame(frame);
  }
  renderer.draw(world, { x: -1, y: -1 }, false);
  requestAnimationFrame(frame);
}

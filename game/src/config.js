// Sizzle Station — tuning, recipes and ingredient definitions.
// One file, one job: every number the game balances on lives here.

export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 38; // seconds before a waiting ticket walks out
export const ORDER_SPAWN_EVERY = 9; // seconds between new tickets (shrinks as the shift heats up)
export const ORDER_SPAWN_MIN = 5.5;

export const GRILL_SECONDS = 4; // patty on the grill until perfectly cooked
export const BURN_SECONDS = 9; // patty left longer than this is burnt
export const FRY_SECONDS = 5; // fries in the fryer until golden
export const FRY_BURN_SECONDS = 10;
export const CHOPS_NEEDED = 2; // clicks on the board to chop lettuce / tomato

export const BASE_REWARD = 10; // coins for a served dish, before tip and combo
export const TIP_PER_PATIENCE = 8; // extra coins when served with patience to spare
export const WRONG_PENALTY = 5; // coins lost serving a plate no ticket wants
export const EXPIRED_PENALTY = 4; // coins lost when a ticket walks out
export const COMBO_STEP = 2; // extra coins per consecutive perfect serve

// An ingredient the player can pick up. `prep` says what must happen before it
// can go on a plate: none (ready), grill, fry or chop.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', prep: 'none', color: '#e8a95c' },
  { id: 'patty', name: 'Patty', key: '2', prep: 'grill', color: '#b06a4a' },
  { id: 'lettuce', name: 'Lettuce', key: '3', prep: 'chop', color: '#7dc383' },
  { id: 'tomato', name: 'Tomato', key: '4', prep: 'chop', color: '#e4573d' },
  { id: 'cheese', name: 'Cheese', key: '5', prep: 'none', color: '#ffc93c' },
  { id: 'fries', name: 'Fries', key: '6', prep: 'fry', color: '#f7d774' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

// A dish is a set of finished ingredients. `needs` lists finished ids:
// a grilled patty is 'patty-grilled', fried fries are 'fries-fried', chopped
// lettuce/tomato are 'lettuce-chopped' / 'tomato-chopped'.
export const RECIPES = [
  {
    id: 'burger',
    name: 'Classic Burger',
    needs: ['bun', 'patty-grilled', 'lettuce-chopped', 'tomato-chopped'],
    color: '#e8a95c',
  },
  {
    id: 'melt',
    name: 'Cheesy Melt',
    needs: ['bun', 'patty-grilled', 'cheese'],
    color: '#ffc93c',
  },
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['lettuce-chopped', 'tomato-chopped', 'cheese'],
    color: '#7dc383',
  },
  {
    id: 'basket',
    name: 'Fries Basket',
    needs: ['fries-fried', 'cheese'],
    color: '#f7d774',
  },
  {
    id: 'deluxe',
    name: 'Deluxe Stack',
    needs: ['bun', 'patty-grilled', 'patty-grilled', 'cheese', 'tomato-chopped'],
    color: '#c96f4a',
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Finished ingredient ids, in the order the plate stacks them.
export const FINISHED_ORDER = [
  'bun',
  'patty-grilled',
  'lettuce-chopped',
  'tomato-chopped',
  'cheese',
  'fries-fried',
];

// Short labels for the finished pieces, shown on the plate and tickets.
export const FINISHED_LABEL = {
  bun: 'Bun',
  'patty-grilled': 'Grilled patty',
  'lettuce-chopped': 'Lettuce',
  'tomato-chopped': 'Tomato',
  cheese: 'Cheese',
  'fries-fried': 'Fries',
};

// How many of each recipe the rush can ask for before the shift ends.
export const RECIPE_WEIGHTS = { burger: 5, melt: 4, salad: 3, basket: 3, deluxe: 2 };

// Shared screen geometry (1280x720 canvas): the order board, the counter with
// its ingredient bins, the grill, fryer and chopping board, the assembly plate
// and the serve bell. render.js paints these rects; input.js hit-tests them.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 84, w: 300, h: 300 },
  ticketH: 88,
  ticketGap: 10,
  grill: { x: 24, y: 404, w: 300, h: 130 },
  fryer: { x: 24, y: 548, w: 300, h: 130 },
  boardChop: { x: 348, y: 404, w: 300, h: 130 },
  bins: { x: 348, y: 84, w: 560, h: 140, cols: 3, rows: 2 },
  plate: { x: 348, y: 244, w: 560, h: 140 },
  serve: { x: 932, y: 244, w: 324, h: 66 },
  trash: { x: 932, y: 318, w: 324, h: 66 },
  hint: { x: 932, y: 404, w: 324, h: 130 },
  counter: { x: 348, y: 548, w: 908, h: 130 },
};

export function binRect(index) {
  const b = LAYOUT.bins;
  const cellW = b.w / b.cols;
  const cellH = b.h / b.rows;
  const col = index % b.cols;
  const row = Math.floor(index / b.cols);
  return { x: b.x + col * cellW + 6, y: b.y + row * cellH + 6, w: cellW - 12, h: cellH - 12 };
}

export function ticketRect(index) {
  return {
    x: LAYOUT.board.x + 12,
    y: LAYOUT.board.y + 44 + index * (LAYOUT.ticketH + LAYOUT.ticketGap),
    w: LAYOUT.board.w - 24,
    h: LAYOUT.ticketH,
  };
}

export function grillSlotRect(index) {
  const g = LAYOUT.grill;
  return { x: g.x + 14 + index * 140, y: g.y + 44, w: 128, h: 72 };
}

export function fryerSlotRect(index) {
  const f = LAYOUT.fryer;
  return { x: f.x + 14 + index * 140, y: f.y + 44, w: 128, h: 72 };
}

// Inline types for worker (cannot import from lib in worker context)
type Status = "queued" | "assigned" | "in_progress" | "blocked" | "done";

interface WorkItem {
  id: string;
  group: string;
  sector: string;
  depends_on: string[];
  estimate_ms: number;
  started_at?: number;
  eta_ms?: number;
  tps_min: number;
  tps_max: number;
  tps: number;
  tokens_done: number;
  est_tokens: number;
  status: Status;
  agent_id?: string;
}

interface Agent {
  id: string;
  work_item_id: string;
  x: number;
  y: number;
  v: number;
  curve_phase: number;
}

interface ProjectMetrics {
  active_agents: number;
  total_tokens: number;
  total_spend_usd: number;
  live_tps: number;
  live_spend_per_s: number;
  completion_rate: number;
}

interface AppState {
  items: Record<string, WorkItem>;
  agents: Record<string, Agent>;
  metrics: ProjectMetrics;
  seed: string;
  running: boolean;
}

type SimIntent =
  | { type: "set_running"; running: boolean }
  | { type: "set_plan"; plan: "Calm" | "Rush" | "Web" }
  | { type: "set_seed"; seed: string }
  | { type: "set_speed"; speed: number }
  | { type: "request_snapshot" };

type SimMsg =
  | { type: "snapshot"; state: AppState }
  | {
      type: "tick";
      tick_id: number;
      items?: Partial<WorkItem>[];
      agents?: Partial<Agent>[];
      metrics?: Partial<ProjectMetrics>;
    }
  | { type: "deps_cleared"; id: string }
  | { type: "start_item"; id: string; agent: Agent }
  | { type: "complete_item"; id: string };

// Constants
const COST_PER_TOKEN_USD = 0.000002;
const TICK_INTERVAL_MS = 50;
const MAX_CONCURRENT = 12;
const V_MIN = 0.002;
// const V_MAX = 0.01; // Phase 4: used in radar rendering

let state: AppState = {
  items: {},
  agents: {},
  metrics: {
    active_agents: 0,
    total_tokens: 0,
    total_spend_usd: 0,
    live_tps: 0,
    live_spend_per_s: 0,
    completion_rate: 0,
  },
  seed: "default",
  running: false,
};

let tickId = 0;
let tickIntervalId: NodeJS.Timeout | null = null;
// let rng = createSeededRNG("default"); // Phase 3: use for deterministic TPS wobble
// let lastStartAttempt = 0; // Phase 3: use for Poisson start cadence

// function createSeededRNG(seed: string) { // Phase 3: move to lib/rng.ts
//   let hash = 0;
//   for (let i = 0; i < seed.length; i++) {
//     const char = seed.charCodeAt(i);
//     hash = (hash << 5) - hash + char;
//     hash = hash & hash;
//   }
//   let state = Math.abs(hash) || 1;

//   return {
//     next: (): number => {
//       let t = (state += 0x6d2b79f5);
//       t = Math.imul(t ^ (t >>> 15), 1 | t);
//       t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
//       return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//     },
//     nextInt: (min: number, max: number): number => {
//       const r = createSeededRNG("dummy").next();
//       state = (state ^ (Math.floor(r * 10000) | 0)) >>> 0;
//       return Math.floor(state / 4294967296 * (max - min + 1)) + min;
//     },
//   };
// }

function generateCalmPlan(): Record<string, WorkItem> {
  const items: Record<string, WorkItem> = {};

  // A series: Planning, 6 items with chain deps
  for (let i = 1; i <= 6; i++) {
    const itemId = `A${i}`;
    items[itemId] = {
      id: itemId,
      group: "A",
      sector: "Planning",
      depends_on: i > 1 ? [`A${i - 1}`] : [],
      estimate_ms: 40000 - (i - 1) * 3000,
      tps_min: 8,
      tps_max: 16,
      tps: 12,
      tokens_done: 0,
      est_tokens: 12 * (40000 - (i - 1) * 3000) / 1000,
      status: "queued",
    };
  }

  // B series: Build, 6 items with chain deps
  for (let i = 1; i <= 6; i++) {
    const itemId = `B${i}`;
    items[itemId] = {
      id: itemId,
      group: "B",
      sector: "Build",
      depends_on: i > 1 ? [`B${i - 1}`] : [],
      estimate_ms: 50000 - (i - 1) * 4000,
      tps_min: 10,
      tps_max: 18,
      tps: 14,
      tokens_done: 0,
      est_tokens: 14 * (50000 - (i - 1) * 4000) / 1000,
      status: "queued",
    };
  }

  return items;
}

function resolveEligible(items: Record<string, WorkItem>): Set<string> {
  const eligible = new Set<string>();
  const memo = new Map<string, boolean>();

  function checkDepsSatisfied(id: string, visiting = new Set<string>()): boolean {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return false; // cycle

    visiting.add(id);
    const item = items[id];
    if (!item) return false;

    for (const dep of item.depends_on) {
      const depItem = items[dep];
      if (!depItem) continue; // missing dep treated as unmet
      if (depItem.status !== "done" && !checkDepsSatisfied(dep, visiting)) {
        visiting.delete(id);
        memo.set(id, false);
        return false;
      }
    }

    visiting.delete(id);
    memo.set(id, true);
    return true;
  }

  for (const id in items) {
    if (checkDepsSatisfied(id)) {
      eligible.add(id);
    }
  }

  return eligible;
}

function initState(): void {
  state = {
    items: generateCalmPlan(),
    agents: {},
    metrics: {
      active_agents: 0,
      total_tokens: 0,
      total_spend_usd: 0,
      live_tps: 0,
      live_spend_per_s: 0,
      completion_rate: 0,
    },
    seed: "default",
    running: false,
  };
  tickId = 0;
  // rng = createSeededRNG("default"); // Phase 3
  // lastStartAttempt = 0; // Phase 3
}

function sendSnapshot(): void {
  const msg: SimMsg = {
    type: "snapshot",
    state: JSON.parse(JSON.stringify(state)),
  };
  self.postMessage(msg);
}

function tick(): void {
  if (!state.running) return;

  const now = performance.now();

  // Phase 1: Resolve dependencies - queued → assigned
  const eligible = resolveEligible(state.items);
  const changedItems: Partial<WorkItem>[] = [];

  for (const itemId in state.items) {
    const item = state.items[itemId];
    if (item.status === "queued" && eligible.has(itemId)) {
      item.status = "assigned";
      changedItems.push({ id: item.id, status: item.status });
    }
  }

  // Phase 2: Start items stochastically (Poisson-like)
  const inProgressCount = Object.values(state.items).filter(
    (i) => i.status === "in_progress"
  ).length;

  if (inProgressCount < MAX_CONCURRENT && Math.random() < 0.3) {
    // Find an assigned item to start
    let started = false;
    for (const itemId in state.items) {
      if (started) break;
      const item = state.items[itemId];
      if (item.status === "assigned") {
        item.status = "in_progress";
        item.started_at = now;
        const agentId = `A${Object.keys(state.agents).length + 1}`;
        const agent: Agent = {
          id: agentId,
          work_item_id: itemId,
          x: 1.0,
          y: 0,
          v: V_MIN,
          curve_phase: 0,
        };
        state.agents[agentId] = agent;
        item.agent_id = agentId;
        changedItems.push({
          id: item.id,
          status: item.status,
          started_at: item.started_at,
          agent_id: item.agent_id,
        });
        started = true;
      }
    }
  }

  // Phase 3: Update in-progress items
  for (const itemId in state.items) {
    const item = state.items[itemId];
    if (item.status === "in_progress" && item.started_at) {
      // Simple TPS wobble (bounded)
      const noise = (Math.random() - 0.5) * 2; // -1 to 1
      item.tps = Math.max(
        item.tps_min,
        Math.min(item.tps_max, item.tps + noise * 0.5)
      );

      // Accumulate tokens
      item.tokens_done += item.tps * (TICK_INTERVAL_MS / 1000);

      // Update ETA
      const elapsed = now - item.started_at;
      item.eta_ms = Math.max(
        0,
        item.estimate_ms - elapsed
      );

      // Check completion
      if (item.tokens_done >= item.est_tokens || elapsed > item.estimate_ms * 1.5) {
        item.status = "done";
        item.tokens_done = item.est_tokens;
        if (item.agent_id) {
          delete state.agents[item.agent_id];
          item.agent_id = undefined;
        }
      }

      changedItems.push({
        id: item.id,
        status: item.status,
        tps: item.tps,
        tokens_done: item.tokens_done,
        eta_ms: item.eta_ms,
      });
    }
  }

  // Phase 4: Recalculate metrics
  const inProgress = Object.values(state.items).filter(
    (i) => i.status === "in_progress"
  );
  const done = Object.values(state.items).filter(
    (i) => i.status === "done"
  );

  state.metrics.active_agents = Object.keys(state.agents).length;
  state.metrics.total_tokens = Object.values(state.items).reduce(
    (sum, i) => sum + i.tokens_done,
    0
  );
  state.metrics.total_spend_usd =
    state.metrics.total_tokens * COST_PER_TOKEN_USD;
  state.metrics.live_tps = inProgress.reduce((sum, i) => sum + i.tps, 0);
  state.metrics.live_spend_per_s =
    state.metrics.live_tps * COST_PER_TOKEN_USD;

  // Completion rate: done / eligible
  const eligibleCount = eligible.size + inProgressCount + done.length;
  state.metrics.completion_rate =
    eligibleCount > 0 ? done.length / eligibleCount : 0;

  tickId++;

  const msg: SimMsg = {
    type: "tick",
    tick_id: tickId,
    items: changedItems.length > 0 ? changedItems : undefined,
    metrics: state.metrics,
  };
  self.postMessage(msg);
}

function startTicking(): void {
  if (tickIntervalId !== null) return;
  tickIntervalId = setInterval(tick, TICK_INTERVAL_MS);
}

function stopTicking(): void {
  if (tickIntervalId !== null) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
}

function handleIntent(intent: SimIntent): void {
  switch (intent.type) {
    case "set_running":
      state.running = intent.running;
      if (intent.running) {
        startTicking();
      } else {
        stopTicking();
      }
      break;

    case "set_plan":
      // Phase 3: implement plan switching
      break;

    case "set_seed":
      state.seed = intent.seed;
      break;

    case "set_speed":
      // Phase 3: implement speed multiplier
      break;

    case "request_snapshot":
      sendSnapshot();
      break;
  }
}

self.onmessage = (event: MessageEvent<SimIntent>) => {
  handleIntent(event.data);
};

// Initialize and send snapshot on startup
initState();
state.running = true;
sendSnapshot();
startTicking();

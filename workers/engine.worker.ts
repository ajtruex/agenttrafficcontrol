// Inline types for worker (cannot import from lib in worker context)
interface ProjectMetrics {
  active_agents: number;
  total_tokens: number;
  total_spend_usd: number;
  live_tps: number;
  live_spend_per_s: number;
  completion_rate: number;
}

interface AppState {
  items: Record<string, any>;
  agents: Record<string, any>;
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
      items?: any[];
      agents?: any[];
      metrics?: Partial<ProjectMetrics>;
    }
  | { type: "deps_cleared"; id: string }
  | { type: "start_item"; id: string; agent: any }
  | { type: "complete_item"; id: string };

// Constants
const COST_PER_TOKEN_USD = 0.000002;
const TICK_INTERVAL_MS = 50;

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

function initState(): void {
  state = {
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
  tickId = 0;
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

  // Phase 1: Stub tick with empty items/agents
  // Phase 2 will implement real item/agent logic

  tickId++;

  // Recalculate metrics (stub values for Phase 1)
  state.metrics.active_agents = Object.keys(state.agents).length;
  state.metrics.total_spend_usd =
    state.metrics.total_tokens * COST_PER_TOKEN_USD;
  state.metrics.live_spend_per_s =
    state.metrics.live_tps * COST_PER_TOKEN_USD;

  const msg: SimMsg = {
    type: "tick",
    tick_id: tickId,
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

import { AppState, SimMsg, SimIntent } from "../lib/types";
import { COST_PER_TOKEN_USD } from "../lib/constants";

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
  running: true,
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
    running: true,
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

  // In Phase 0, just a stub tick
  // Phase 2 will implement real item/agent logic

  tickId++;

  // Recalculate metrics
  state.metrics.active_agents = Object.keys(state.agents).length;
  state.metrics.total_spend_usd = state.metrics.total_tokens * COST_PER_TOKEN_USD;
  state.metrics.live_spend_per_s = state.metrics.live_tps * COST_PER_TOKEN_USD;

  const msg: SimMsg = {
    type: "tick",
    tick_id: tickId,
    items: [],
    agents: [],
    metrics: state.metrics,
  };
  self.postMessage(msg);
}

function startTicking(): void {
  if (tickIntervalId !== null) return;
  tickIntervalId = setInterval(tick, 50); // 20 Hz
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
sendSnapshot();
startTicking();

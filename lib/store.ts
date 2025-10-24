import { create } from "zustand";
import { AppState, SimIntent } from "./types";
import { STORE_UPDATE_THROTTLE_MS } from "./constants";

interface StoreState extends AppState {
  tick_id: number;
  lastUpdateTime: number;
  pendingUpdates: Partial<AppState> | null;
  setTransport: (send: (intent: SimIntent) => void) => void;
  sendIntent: (intent: SimIntent) => void;
  applySnapshot: (state: AppState) => void;
  applyTickDiff: (tick_id: number, diff: Partial<AppState>) => void;
  flushPendingUpdates: () => void;
}

const initialState: AppState = {
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

let sendIntentFn: ((intent: SimIntent) => void) | null = null;
let throttleTimer: NodeJS.Timeout | null = null;

export const useStore = create<StoreState>((set, get) => ({
  ...initialState,
  tick_id: 0,
  lastUpdateTime: 0,
  pendingUpdates: null,

  setTransport: (send: (intent: SimIntent) => void) => {
    sendIntentFn = send;
  },

  sendIntent: (intent: SimIntent) => {
    if (sendIntentFn) {
      sendIntentFn(intent);
    }
  },

  applySnapshot: (state: AppState) => {
    set({
      items: state.items,
      agents: state.agents,
      metrics: state.metrics,
      seed: state.seed,
      running: state.running,
      tick_id: 0,
      lastUpdateTime: Date.now(),
    });
  },

  applyTickDiff: (tick_id: number, diff: Partial<AppState>) => {
    const state = get();

    // Ignore out-of-order ticks
    if (tick_id <= state.tick_id) {
      return;
    }

    // Accumulate pending updates
    const pending = state.pendingUpdates || {};
    
    if (diff.items && Array.isArray(diff.items)) {
      // diff.items is an array of partial items - merge each one
      pending.items = { ...state.items, ...(pending.items || {}) };
      for (const item of diff.items) {
        if (item.id) {
          pending.items[item.id] = {
            ...pending.items[item.id],
            ...item,
          };
        }
      }
    }
    
    if (diff.agents && Array.isArray(diff.agents)) {
      // diff.agents is an array of partial agents - merge each one
      pending.agents = { ...state.agents, ...(pending.agents || {}) };
      for (const agent of diff.agents) {
        if (agent.id) {
          pending.agents[agent.id] = {
            ...pending.agents[agent.id],
            ...agent,
          };
        }
      }
    }
    
    if (diff.metrics) {
      pending.metrics = {
        ...state.metrics,
        ...diff.metrics,
      };
    }

    // Check if we should flush based on throttle
    const now = Date.now();
    const timeSinceLastUpdate = now - state.lastUpdateTime;

    if (throttleTimer) {
      // Already scheduled, just update pending
      set({ tick_id, pendingUpdates: pending });
    } else if (timeSinceLastUpdate > STORE_UPDATE_THROTTLE_MS) {
      // Enough time has passed, apply immediately
      const updates: Partial<StoreState> = {
        tick_id,
        lastUpdateTime: now,
        pendingUpdates: null,
      };
      if (pending.items) updates.items = pending.items;
      if (pending.agents) updates.agents = pending.agents;
      if (pending.metrics) updates.metrics = pending.metrics;
      set(updates);
    } else {
      // Schedule for later
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        get().flushPendingUpdates();
      }, STORE_UPDATE_THROTTLE_MS - timeSinceLastUpdate);

      set({ tick_id, pendingUpdates: pending });
    }
  },

  flushPendingUpdates: () => {
    const state = get();
    if (!state.pendingUpdates) return;

    const updates: Partial<StoreState> = {
      lastUpdateTime: Date.now(),
      pendingUpdates: null,
      tick_id: state.tick_id,
    };

    if (state.pendingUpdates.items)
      updates.items = state.pendingUpdates.items;
    if (state.pendingUpdates.agents)
      updates.agents = state.pendingUpdates.agents;
    if (state.pendingUpdates.metrics)
      updates.metrics = state.pendingUpdates.metrics;

    set(updates);
  },
}));

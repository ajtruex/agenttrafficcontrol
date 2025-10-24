export const COST_PER_TOKEN_USD = 0.000002;
export const MAX_CONCURRENT = 12;
export const V_MIN = 0.002;
export const V_MAX = 0.01;
export const TRAIL_DECAY = 0.08;
export const RING_COUNT = 5;
export const SECTORS = ["Planning", "Build", "Eval", "Deploy"];

export const SECTOR_COLORS: Record<string, string> = {
  Planning: "#6EE7B7",
  Build: "#93C5FD",
  Eval: "#FCA5A5",
  Deploy: "#FDE68A",
};

export const TICK_INTERVAL_MS = 50; // 20 Hz tick rate for engine
export const STORE_UPDATE_THROTTLE_MS = 150; // Batch store updates

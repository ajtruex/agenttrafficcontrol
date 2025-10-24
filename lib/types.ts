export type Status = "queued" | "assigned" | "in_progress" | "blocked" | "done";

export interface WorkItem {
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

export interface Agent {
  id: string;
  work_item_id: string;
  x: number;
  y: number;
  v: number;
  curve_phase: number;
  spawn_angle?: number;
}

export interface ProjectMetrics {
  active_agents: number;
  total_tokens: number;
  total_spend_usd: number;
  live_tps: number;
  live_spend_per_s: number;
  completion_rate: number;
}

export interface AppState {
  items: Record<string, WorkItem>;
  agents: Record<string, Agent>;
  metrics: ProjectMetrics;
  seed: string;
  running: boolean;
}

export type SimMsg =
  | { type: "snapshot"; state: AppState }
  | { type: "deps_cleared"; id: string }
  | { type: "start_item"; id: string; agent: Agent }
  | {
      type: "tick";
      tick_id: number;
      items?: Partial<WorkItem>[];
      agents?: Partial<Agent>[];
      metrics?: Partial<ProjectMetrics>;
    }
  | { type: "complete_item"; id: string };

export type SimIntent =
  | { type: "set_running"; running: boolean }
  | { type: "set_plan"; plan: "Calm" | "Rush" | "Web" }
  | { type: "set_seed"; seed: string }
  | { type: "set_speed"; speed: number }
  | { type: "request_snapshot" };

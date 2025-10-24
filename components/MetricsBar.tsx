"use client";

import { useStore } from "@/lib/store";

export function MetricsBar() {
  const { metrics } = useStore();

  const formatMetric = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-4">
      {/* Active Agents - Green */}
      <div className="space-y-1">
        <div className="terminal-label text-terminal-green-500 text-xs">
          AGENTS
        </div>
        <div
          className="text-2xl font-bold text-terminal-green"
          style={{
            textShadow: "0 0 8px rgba(0, 255, 0, 0.8)",
          }}
        >
          {metrics.active_agents}
        </div>
      </div>

      {/* Total Tokens - Cyan */}
      <div className="space-y-1">
        <div className="terminal-label text-terminal-cyan text-xs">
          TOKENS
        </div>
        <div
          className="text-2xl font-bold text-terminal-cyan"
          style={{
            textShadow: "0 0 8px rgba(0, 255, 255, 0.8)",
          }}
        >
          {formatMetric(metrics.total_tokens, 0)}
        </div>
      </div>

      {/* Total Spend - Amber */}
      <div className="space-y-1">
        <div className="terminal-label text-terminal-amber text-xs">
          SPEND
        </div>
        <div
          className="text-2xl font-bold text-terminal-amber"
          style={{
            textShadow: "0 0 8px rgba(255, 176, 0, 0.8)",
          }}
        >
          ${formatMetric(metrics.total_spend_usd, 4)}
        </div>
      </div>

      {/* Live TPS - Green */}
      <div className="space-y-1">
        <div className="terminal-label text-terminal-green-500 text-xs">
          TPS
        </div>
        <div
          className="text-2xl font-bold text-terminal-green"
          style={{
            textShadow: "0 0 8px rgba(0, 255, 0, 0.8)",
          }}
        >
          {formatMetric(metrics.live_tps, 1)}
        </div>
      </div>

      {/* Spend/sec - Amber */}
      <div className="space-y-1">
        <div className="terminal-label text-terminal-amber-dark text-xs">
          $/sec
        </div>
        <div
          className="text-2xl font-bold text-terminal-amber-dark"
          style={{
            textShadow: "0 0 8px rgba(255, 165, 0, 0.8)",
          }}
        >
          ${formatMetric(metrics.live_spend_per_s, 7)}
        </div>
      </div>

      {/* Completion - Cyan */}
      <div className="space-y-1">
        <div className="terminal-label text-terminal-cyan text-xs">
          DONE
        </div>
        <div
          className="text-2xl font-bold text-terminal-cyan"
          style={{
            textShadow: "0 0 8px rgba(0, 255, 255, 0.8)",
          }}
        >
          {formatMetric(metrics.completion_rate * 100, 1)}%
        </div>
      </div>
    </div>
  );
}

"use client";

import { useStore } from "@/lib/store";

export function MetricsBar() {
  const { metrics } = useStore();

  const formatMetric = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="border-terminal bg-terminal-gray-darker border-b">
      <div className="grid grid-cols-6 gap-6 p-4">
        {/* Active Agents - Green */}
        <div className="space-y-1">
          <div className="terminal-label text-terminal-green-500">
            Active Agents
          </div>
          <div
            className="text-3xl font-bold text-terminal-green"
            style={{
              textShadow: "0 0 12px rgba(0, 255, 0, 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            {metrics.active_agents}
          </div>
        </div>

        {/* Total Tokens - Cyan */}
        <div className="space-y-1">
          <div className="terminal-label text-terminal-cyan">
            Total Tokens
          </div>
          <div
            className="text-3xl font-bold text-terminal-cyan"
            style={{
              textShadow: "0 0 12px rgba(0, 255, 255, 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            {formatMetric(metrics.total_tokens, 0)}
          </div>
        </div>

        {/* Total Spend - Amber */}
        <div className="space-y-1">
          <div className="terminal-label text-terminal-amber">
            Total Spend
          </div>
          <div
            className="text-3xl font-bold text-terminal-amber"
            style={{
              textShadow: "0 0 12px rgba(255, 176, 0, 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            ${formatMetric(metrics.total_spend_usd, 4)}
          </div>
        </div>

        {/* Live TPS - Green */}
        <div className="space-y-1">
          <div className="terminal-label text-terminal-green-500">
            Live TPS
          </div>
          <div
            className="text-3xl font-bold text-terminal-green"
            style={{
              textShadow: "0 0 12px rgba(0, 255, 0, 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            {formatMetric(metrics.live_tps, 1)}
          </div>
        </div>

        {/* Spend/sec - Red/Amber */}
        <div className="space-y-1">
          <div className="terminal-label text-terminal-amber-dark">
            Spend/sec
          </div>
          <div
            className="text-3xl font-bold text-terminal-amber-dark"
            style={{
              textShadow: "0 0 12px rgba(255, 165, 0, 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            ${formatMetric(metrics.live_spend_per_s, 7)}
          </div>
        </div>

        {/* Completion - Cyan */}
        <div className="space-y-1">
          <div className="terminal-label text-terminal-cyan">
            Completion
          </div>
          <div
            className="text-3xl font-bold text-terminal-cyan"
            style={{
              textShadow: "0 0 12px rgba(0, 255, 255, 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            {formatMetric(metrics.completion_rate * 100, 1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useStore } from "@/lib/store";

export function MetricsBar() {
  const { metrics } = useStore();

  const formatMetric = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 p-4">
      <div className="grid grid-cols-6 gap-4 text-center">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Active Agents
          </div>
          <div className="text-2xl font-bold text-green-400">
            {metrics.active_agents}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Total Tokens
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {formatMetric(metrics.total_tokens, 0)}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Total Spend
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${formatMetric(metrics.total_spend_usd, 4)}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Live TPS
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {formatMetric(metrics.live_tps, 1)}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Spend/sec
          </div>
          <div className="text-2xl font-bold text-orange-400">
            ${formatMetric(metrics.live_spend_per_s, 7)}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">
            Completion
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {formatMetric(metrics.completion_rate * 100, 1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useStore } from "@/lib/store";
import { SECTOR_COLORS } from "@/lib/constants";

export function WorkTable() {
  const { items } = useStore();

  const statusColors: Record<string, string> = {
    queued: "bg-slate-700 text-slate-300",
    assigned: "bg-yellow-700 text-yellow-100",
    in_progress: "bg-blue-700 text-blue-100",
    done: "bg-green-700 text-green-100",
    blocked: "bg-red-700 text-red-100",
  };

  const formatTime = (ms: number | undefined) => {
    if (!ms) return "—";
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  // Sort items by status, then by ID
  const statusOrder: Record<string, number> = {
    queued: 0,
    assigned: 1,
    in_progress: 2,
    blocked: 3,
    done: 4,
  };

  const sortedItems = Object.values(items).sort((a, b) => {
    const statusDiff =
      (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    if (statusDiff !== 0) return statusDiff;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-900">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-slate-800">
          <tr className="border-b border-slate-700">
            <th className="px-4 py-2 text-left font-semibold text-slate-300">
              ID
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-300">
              Sector
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-300">
              Status
            </th>
            <th className="px-4 py-2 text-right font-semibold text-slate-300">
              Tokens (done/est)
            </th>
            <th className="px-4 py-2 text-right font-semibold text-slate-300">
              TPS (cur / min–max)
            </th>
            <th className="px-4 py-2 text-right font-semibold text-slate-300">
              ETA
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-300">
              Deps
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-300">
              Agent
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-4 py-2 font-mono font-bold text-white">
                {item.id}
              </td>
              <td className="px-4 py-2">
                <span
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: SECTOR_COLORS[item.sector] || "#6B7280",
                    color: "#000",
                  }}
                >
                  {item.sector}
                </span>
              </td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    statusColors[item.status]
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-2 text-right text-slate-400 font-mono text-xs">
                {item.tokens_done.toFixed(0)}/{item.est_tokens.toFixed(0)}
              </td>
              <td className="px-4 py-2 text-right text-slate-400 font-mono text-xs">
                {item.tps.toFixed(1)} / {item.tps_min}–{item.tps_max}
              </td>
              <td className="px-4 py-2 text-right text-slate-400 font-mono text-xs">
                {formatTime(item.eta_ms)}
              </td>
              <td className="px-4 py-2 text-slate-400 text-xs">
                {item.depends_on.length > 0
                  ? item.depends_on.join(", ")
                  : "—"}
              </td>
              <td className="px-4 py-2 text-slate-400 font-mono text-xs">
                {item.agent_id || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

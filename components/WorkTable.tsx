"use client";

import { useStore } from "@/lib/store";
import { SECTOR_COLORS } from "@/lib/constants";

export function WorkTable() {
  const { items } = useStore();

  const statusClasses: Record<string, string> = {
    queued: "status-queued",
    assigned: "status-assigned",
    in_progress: "status-in_progress",
    done: "status-done",
    blocked: "status-blocked",
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
    <div className="flex-1 overflow-auto bg-terminal-black border-terminal">
      <table className="w-full text-xs border-collapse font-mono">
        <thead className="sticky top-0 bg-terminal-gray-darker border-terminal">
          <tr className="border-b border-terminal-gray-dark">
            <th className="px-3 py-2 text-left font-bold text-terminal-amber uppercase">
              ID
            </th>
            <th className="px-3 py-2 text-left font-bold text-terminal-amber uppercase">
              Sector
            </th>
            <th className="px-3 py-2 text-left font-bold text-terminal-amber uppercase">
              Status
            </th>
            <th className="px-3 py-2 text-right font-bold text-terminal-amber uppercase">
              Tokens
            </th>
            <th className="px-3 py-2 text-right font-bold text-terminal-amber uppercase">
              TPS
            </th>
            <th className="px-3 py-2 text-right font-bold text-terminal-amber uppercase">
              ETA
            </th>
            <th className="px-3 py-2 text-left font-bold text-terminal-amber uppercase">
              Deps
            </th>
            <th className="px-3 py-2 text-left font-bold text-terminal-amber uppercase">
              Agent
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => (
            <tr
              key={item.id}
              className="border-b border-terminal-gray-dark hover:bg-terminal-gray-darker/50 transition-colors"
            >
              <td
                className="px-3 py-2 font-bold text-terminal-green"
                style={{ textShadow: "0 0 6px rgba(0, 255, 0, 0.6)" }}
              >
                {item.id}
              </td>
              <td className="px-3 py-2">
                <span
                  className="px-2 py-1 rounded text-xs font-semibold inline-block"
                  style={{
                    backgroundColor: SECTOR_COLORS[item.sector] || "#6B7280",
                    color: "#000",
                    textShadow: "0 0 4px rgba(255, 255, 255, 0.3)",
                  }}
                >
                  {item.sector}
                </span>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold inline-block ${
                    statusClasses[item.status]
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-terminal-cyan">
                {item.tokens_done.toFixed(0)}/{item.est_tokens.toFixed(0)}
              </td>
              <td className="px-3 py-2 text-right text-terminal-gray-muted">
                {item.tps.toFixed(1)} / {item.tps_min}–{item.tps_max}
              </td>
              <td className="px-3 py-2 text-right text-terminal-amber-dark">
                {formatTime(item.eta_ms)}
              </td>
              <td className="px-3 py-2 text-terminal-gray-text text-xs">
                {item.depends_on.length > 0
                  ? item.depends_on.join(", ")
                  : "—"}
              </td>
              <td className="px-3 py-2 text-terminal-cyan font-bold">
                {item.agent_id || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

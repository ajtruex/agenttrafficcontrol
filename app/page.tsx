"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { WorkerTransport } from "@/lib/simBridge";
import { MetricsBar } from "@/components/MetricsBar";
import { WorkTable } from "@/components/WorkTable";

export default function Home() {
  const transportRef = useRef<WorkerTransport | null>(null);
  const { tick_id, running, sendIntent, setTransport, applySnapshot, applyTickDiff } = useStore();

  useEffect(() => {
    // Initialize transport on mount
    if (typeof window === "undefined") return;

    try {
      const transport = new WorkerTransport();
      transportRef.current = transport;
      setTransport((intent) => transport.sendIntent(intent));

      // Handle messages from worker
      transport.onMessage((msg) => {
        if (msg.type === "snapshot") {
          applySnapshot(msg.state);
        } else if (msg.type === "tick") {
          const diff: any = {};
          if (msg.items) diff.items = msg.items;
          if (msg.agents) diff.agents = msg.agents;
          if (msg.metrics) diff.metrics = msg.metrics;
          applyTickDiff(msg.tick_id, diff);
        }
      });
    } catch (err) {
      console.error("Failed to initialize worker:", err);
    }

    return () => {
      if (transportRef.current) {
        transportRef.current.terminate();
      }
    };
  }, [setTransport, applySnapshot, applyTickDiff]);

  const handleToggleRunning = () => {
    sendIntent({ type: "set_running", running: !running });
  };

  return (
    <main className="w-full h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Calming Control Room
          </h1>
          <p className="text-sm text-slate-400">Tick: {tick_id}</p>
        </div>

        <button
          onClick={handleToggleRunning}
          className={`px-6 py-2 rounded font-semibold transition-colors ${
            running
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {running ? "Pause" : "Run"}
        </button>
      </div>

      {/* Metrics Bar */}
      <MetricsBar />

      {/* Work Items Table */}
      <WorkTable />
    </main>
  );
}

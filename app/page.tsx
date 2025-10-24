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
    <main className="w-full h-full flex flex-col bg-terminal-black font-mono">
      {/* Header */}
      <div className="border-terminal bg-terminal-gray-darker border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold uppercase text-terminal-amber"
            style={{ textShadow: "0 0 10px rgba(255, 176, 0, 0.6)" }}
          >
            CALMING CONTROL ROOM
          </h1>
          <p className="text-xs text-terminal-gray-muted uppercase tracking-widest mt-1">
            TICK: <span style={{ color: "#00FF00", textShadow: "0 0 6px rgba(0, 255, 0, 0.6)" }}>{tick_id}</span>
          </p>
        </div>

        <button
          onClick={handleToggleRunning}
          className={`px-6 py-2 rounded font-bold uppercase tracking-wider transition-all text-xs ${
            running
              ? "bg-terminal-red text-white hover:bg-red-700"
              : "bg-terminal-green text-black hover:brightness-110"
          }`}
          style={{
            textShadow:
              running
                ? "0 0 8px rgba(255, 0, 0, 0.6)"
                : "0 0 8px rgba(0, 255, 0, 0.6)",
          }}
        >
          {running ? "PAUSE" : "RUN"}
        </button>
      </div>

      {/* Metrics Bar */}
      <MetricsBar />

      {/* Work Items Table */}
      <WorkTable />
    </main>
  );
}

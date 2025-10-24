"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { WorkerTransport } from "@/lib/simBridge";

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
    <main className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold text-slate-100">
          Calming Control Room
        </h1>

        <div className="space-y-4">
          <div className="text-6xl font-mono font-bold text-green-400">
            Tick: {tick_id}
          </div>
          <div className="text-lg text-slate-400">
            {running ? "Running" : "Paused"}
          </div>
        </div>

        <button
          onClick={handleToggleRunning}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
            running
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {running ? "Pause" : "Run"}
        </button>
      </div>
    </main>
  );
}

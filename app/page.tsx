"use client"

import { useEffect, useRef } from "react"
import { useStore } from "@/lib/store"
import { WorkerTransport } from "@/lib/simBridge"
import { Button } from "@/components/ui/button"
import { MetricsBar } from "@/components/MetricsBar"
import { WorkTable } from "@/components/WorkTable"
import { ControlBar } from "@/components/ControlBar"
import { RadarCanvas } from "@/components/RadarCanvas"

export default function Home() {
  const transportRef = useRef<WorkerTransport | null>(null)
  const {
    tick_id,
    running,
    sendIntent,
    setTransport,
    applySnapshot,
    applyTickDiff,
  } = useStore()

  useEffect(() => {
    // Initialize transport on mount
    if (typeof window === "undefined") return

    try {
      const transport = new WorkerTransport()
      transportRef.current = transport
      setTransport((intent) => transport.sendIntent(intent))

      // Handle messages from worker
      transport.onMessage((msg) => {
        if (msg.type === "snapshot") {
          applySnapshot(msg.state)
        } else if (msg.type === "tick") {
          const diff: any = {}
          if (msg.items) diff.items = msg.items
          if (msg.agents) diff.agents = msg.agents
          if (msg.metrics) diff.metrics = msg.metrics
          applyTickDiff(msg.tick_id, diff)
        }
      })

      // Parse URL seed parameter
      const params = new URLSearchParams(window.location.search)
      const urlSeed = params.get("seed")
      if (urlSeed) {
        sendIntent({ type: "set_seed", seed: urlSeed })
      }
    } catch (err) {
      console.error("Failed to initialize worker:", err)
    }

    return () => {
      if (transportRef.current) {
        transportRef.current.terminate()
      }
    }
  }, [setTransport, applySnapshot, applyTickDiff, sendIntent])

  const handleToggleRunning = () => {
    sendIntent({ type: "set_running", running: !running })
  }

  return (
    <main className="w-full h-screen flex flex-col bg-terminal-black font-mono relative overflow-hidden">
      {/* Radar Canvas (fullscreen background) */}
      <RadarCanvas />

      {/* Overlay container */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* Header */}
        <div className="border-terminal bg-terminal-gray-darker border-b px-6 py-4 flex items-center justify-between pointer-events-auto h-20">
          <div>
            <h1
              className="text-xl font-bold uppercase text-terminal-amber"
              style={{ textShadow: "0 0 10px rgba(255, 176, 0, 0.6)" }}
            >
              CALMING CONTROL ROOM
            </h1>
            <p className="text-xs text-terminal-gray-muted uppercase tracking-widest mt-1">
              TICK:{" "}
              <span
                style={{
                  color: "#00FF00",
                  textShadow: "0 0 6px rgba(0, 255, 0, 0.6)",
                }}
              >
                {tick_id}
              </span>
            </p>
          </div>

          <Button
            onClick={handleToggleRunning}
            variant={running ? "destructive" : "secondary"}
            style={{
              textShadow: running
                ? "0 0 8px rgba(255, 0, 0, 0.6)"
                : "0 0 8px rgba(0, 255, 0, 0.6)",
            }}
          >
            {running ? "PAUSE" : "RUN"}
          </Button>
        </div>

        {/* Main Content Grid (3-column layout) */}
        <div className="flex flex-1 overflow-hidden gap-1 px-1 py-1">
          {/* Left Panel: Work Items Table (30%) */}
          <div className="w-fit overflow-hidden pointer-events-auto">
            <div className="border border-terminal-gray-dark rounded bg-terminal-gray-darker/80 h-full overflow-y-auto">
              <WorkTable />
            </div>
          </div>

          {/* Center Panel: Radar (45%) - overlay handled by canvas */}
          <div className="w-fit overflow-hidden rounded border border-terminal-gray-dark">
            {/* Radar already fullscreen, center this section visually */}
            {/* <RadarCanvas /> */}
          </div>

          {/* Right Panel: Metrics (25%) */}
          <div className="w-[25%] overflow-hidden pointer-events-auto">
            <div className="border border-terminal-gray-dark rounded bg-terminal-gray-darker/80 h-full overflow-y-auto p-4">
              <MetricsBar />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar (fixed position) */}
      <ControlBar />
    </main>
  )
}

"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  V_MIN,
  V_MAX,
  TRAIL_DECAY,
  RING_COUNT,
  SECTOR_COLORS,
} from "@/lib/constants";

const FLARE_DURATION_MS = 300;

interface FlareState {
  x: number;
  y: number;
  startTime: number;
}

export function RadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef<Set<string>>(new Set());
  const radarStateRef = useRef<{
    agents: Map<string, { x: number; y: number; angle: number; progress: number }>;
    flares: FlareState[];
    lastFrameTime: number;
  }>({
    agents: new Map(),
    flares: [],
    lastFrameTime: performance.now(),
  });

  const { items, agents } = useStore();

  // Initialize canvas and offscreen buffer on mount
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // Create offscreen buffer for static rings
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement("canvas");
      }
      offscreenRef.current.width = canvas.width;
      offscreenRef.current.height = canvas.height;
      drawStaticLayer(offscreenRef.current);
    };

    updateCanvasSize();
    const resizeListener = () => updateCanvasSize();
    window.addEventListener("resize", resizeListener);

    return () => window.removeEventListener("resize", resizeListener);
  }, []);

  const drawStaticLayer = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.85;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;

    // Draw concentric rings
    for (let i = 1; i <= RING_COUNT; i++) {
      const r = (maxRadius / RING_COUNT) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Add tick marks
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const x1 = centerX + Math.cos(angle) * r;
        const y1 = centerY + Math.sin(angle) * r;
        const x2 = centerX + Math.cos(angle) * (r + 4);
        const y2 = centerY + Math.sin(angle) * (r + 4);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Center checkbox
    const checkboxSize = 16;
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - checkboxSize / 2,
      centerY - checkboxSize / 2,
      checkboxSize,
      checkboxSize
    );
  };

  const getAgentColor = (workItemId: string): string => {
    const item = items[workItemId];
    if (!item) return "#FFFFFF";
    return SECTOR_COLORS[item.sector] || "#FFFFFF";
  };

  const drawRadar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.85;

    const now = performance.now();
    const dt = (now - radarStateRef.current.lastFrameTime) / 1000;
    radarStateRef.current.lastFrameTime = now;

    // Draw static layer (offscreen buffer)
    if (offscreenRef.current) {
      ctx.drawImage(offscreenRef.current, 0, 0);
    }

    // Motion buffer: draw trails with decay
    ctx.fillStyle = `rgba(10, 10, 10, ${TRAIL_DECAY})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update agent positions
    const newAgents = new Map<string, any>();

    for (const [agentId, agent] of Object.entries(agents)) {
      const item = items[agent.work_item_id];
      if (!item || item.status !== "in_progress") continue;

      let radarAgent = radarStateRef.current.agents.get(agentId);

      // Spawn new agent if not tracked
      if (!radarAgent) {
        const angle = Math.random() * Math.PI * 2;
        radarAgent = {
          x: Math.cos(angle) * maxRadius,
          y: Math.sin(angle) * maxRadius,
          angle,
          progress: 0,
        };
        radarStateRef.current.agents.set(agentId, radarAgent);
      }

      // Calculate speed from TPS
      const tpsRange = item.tps_max - item.tps_min;
      const normalizedTps =
        tpsRange > 0
          ? (item.tps - item.tps_min) / tpsRange
          : 0.5;
      const speed = V_MIN + (V_MAX - V_MIN) * normalizedTps;

      // Update progress toward center
      radarAgent.progress = Math.min(1, radarAgent.progress + speed * dt);

      // Cubic Bézier motion toward center
      // Start: rim, End: center, Control points: tangential perturbation
      const cp1Angle = radarAgent.angle + Math.PI / 4;
      const cp1Dist = maxRadius * 0.6;
      const cp1X = Math.cos(cp1Angle) * cp1Dist;
      const cp1Y = Math.sin(cp1Angle) * cp1Dist;

      const cp2Angle = radarAgent.angle - Math.PI / 4;
      const cp2Dist = maxRadius * 0.3;
      const cp2X = Math.cos(cp2Angle) * cp2Dist;
      const cp2Y = Math.sin(cp2Angle) * cp2Dist;

      // Cubic Bézier interpolation
      const t = radarAgent.progress;
      const t1 = 1 - t;
      const t2 = t * t;
      const t3 = t1 * t1;

      const x =
        t3 * radarAgent.x +
        3 * t1 * t1 * t * cp1X +
        3 * t1 * t2 * cp2X +
        t2 * t * 0; // center is (0,0)
      const y =
        t3 * radarAgent.y +
        3 * t1 * t1 * t * cp1Y +
        3 * t1 * t2 * cp2Y +
        t2 * t * 0;

      newAgents.set(agentId, { x, y, progress: radarAgent.progress });

      // Draw agent (triangle arrow)
      const color = getAgentColor(agent.work_item_id);
      ctx.fillStyle = color;
      ctx.globalAlpha = 1 - t * 0.2; // Slight fade as approaches center

      const arrowSize = 8;
      const arrowAngle = Math.atan2(y, x);
      ctx.save();
      ctx.translate(centerX + x * maxRadius, centerY + y * maxRadius);
      ctx.rotate(arrowAngle);
      ctx.beginPath();
      ctx.moveTo(arrowSize, 0);
      ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
      ctx.lineTo(-arrowSize / 2, arrowSize / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Agent label (small text, faded)
      ctx.globalAlpha = Math.max(0.4, 1 - t * 1.5);
      ctx.fillStyle = color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `${agentId}`,
        centerX + x * maxRadius,
        centerY + y * maxRadius - 12
      );

      ctx.globalAlpha = 1;

      // Trigger completion if reached center
      if (radarAgent.progress >= 1 && !completedRef.current.has(agentId)) {
        radarStateRef.current.flares.push({
          x: 0,
          y: 0,
          startTime: now,
        });
        completedRef.current.add(agentId);
      }
    }

    // Clean up completed agents
    for (const agentId of completedRef.current) {
      if (!agents[agentId]) {
        completedRef.current.delete(agentId);
      }
    }

    radarStateRef.current.agents = newAgents;

    // Draw flares
    ctx.globalAlpha = 1;
    const flaresCopy = radarStateRef.current.flares.filter((flare) => {
      const elapsed = now - flare.startTime;
      if (elapsed > FLARE_DURATION_MS) return false;

      const progress = elapsed / FLARE_DURATION_MS;
      const maxFlareRadius = maxRadius * 0.3;
      const flareRadius = maxFlareRadius * progress;

      // Easing out
      const easeProgress = progress * progress;

      ctx.strokeStyle = `rgba(255, 200, 0, ${1 - easeProgress})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, flareRadius, 0, Math.PI * 2);
      ctx.stroke();

      return true;
    });
    radarStateRef.current.flares = flaresCopy;

    // Tick center checkbox briefly on completion
    if (flaresCopy.length > 0) {
      ctx.fillStyle = "#999999";
      const checkboxSize = 12;
      ctx.fillRect(
        centerX - checkboxSize / 2,
        centerY - checkboxSize / 2,
        checkboxSize,
        checkboxSize
      );
    }
  };

  // Main animation loop
  useEffect(() => {
    let animationId: number;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const animate = () => {
      drawRadar();
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        backgroundColor: "#0a0a0a",
        display: "block",
      }}
    />
  );
}

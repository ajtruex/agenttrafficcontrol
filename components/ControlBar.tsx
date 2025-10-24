"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function ControlBar() {
  const { sendIntent } = useStore();
  const [plan, setPlan] = useState<"Calm" | "Rush" | "Web">("Calm");
  const [seed, setSeed] = useState("auto");
  const [speed, setSpeed] = useState(1);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem("plan") as "Calm" | "Rush" | "Web" | null;
    const savedSeed = localStorage.getItem("seed");
    const savedSpeed = localStorage.getItem("speed");

    if (savedPlan) setPlan(savedPlan);
    if (savedSeed) setSeed(savedSeed);
    if (savedSpeed) setSpeed(parseInt(savedSpeed, 10));
  }, []);

  // Save to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("plan", plan);
  }, [plan]);

  useEffect(() => {
    localStorage.setItem("seed", seed);
  }, [seed]);

  useEffect(() => {
    localStorage.setItem("speed", speed.toString());
  }, [speed]);

  const handlePlanChange = (newPlan: "Calm" | "Rush" | "Web") => {
    setPlan(newPlan);
    sendIntent({ type: "set_plan", plan: newPlan });
  };

  const handleSeedApply = () => {
    sendIntent({ type: "set_seed", seed });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    sendIntent({ type: "set_speed", speed: newSpeed });
  };

  return (
    <div className="fixed bottom-6 left-6 z-10 space-y-4">
      <div className="flex gap-2">
        {(["Calm", "Rush", "Web"] as const).map((p) => (
          <Button
            key={p}
            variant={plan === p ? "default" : "outline"}
            size="sm"
            onClick={() => handlePlanChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="seed"
          className="bg-terminal-gray-darker border border-terminal-gray-dark text-terminal-white px-2 py-1 rounded text-xs font-mono"
          style={{
            outline: "none",
            boxShadow: "inset 0 0 10px rgba(255, 176, 0, 0.15)",
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSeedApply}
        >
          Apply
        </Button>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <Button
            key={s}
            variant={speed === s ? "default" : "outline"}
            size="sm"
            onClick={() => handleSpeedChange(s)}
          >
            ×{s}
          </Button>
        ))}
      </div>
    </div>
  );
}

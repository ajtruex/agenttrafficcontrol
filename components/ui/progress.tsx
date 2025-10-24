"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "success" | "danger";
  }
>(({ className, value, variant = "default", ...props }, ref) => {
  const variantColors: Record<string, { bg: string; indicator: string }> = {
    default: {
      bg: "bg-terminal-gray-dark",
      indicator: "bg-terminal-amber",
    },
    success: {
      bg: "bg-terminal-gray-dark",
      indicator: "bg-terminal-green",
    },
    danger: {
      bg: "bg-terminal-gray-dark",
      indicator: "bg-terminal-red",
    },
  };

  const colors = variantColors[variant];

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={`relative h-2 w-full overflow-hidden rounded-full ${colors.bg} ${
        className || ""
      }`}
      style={{ boxShadow: "inset 0 0 5px rgba(255, 176, 0, 0.2)" }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={`h-full w-full flex-1 rounded-full ${colors.indicator} transition-all`}
        style={{
          transform: `translateX(-${100 - ((value || 0) as number)}%)`,
          boxShadow: `0 0 8px ${variant === "success" ? "rgba(0, 255, 0, 0.6)" : variant === "danger" ? "rgba(255, 0, 0, 0.6)" : "rgba(255, 176, 0, 0.6)"}`,
        }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

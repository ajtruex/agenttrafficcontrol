import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "IBM Plex Mono",
          "Courier New",
          "monospace",
        ],
      },
      colors: {
        // Terminal theme
        "terminal-black": "#000000",
        "terminal-amber": "#FFB000",
        "terminal-amber-dark": "#FFA500",
        "terminal-green": "#00FF00",
        "terminal-cyan": "#00FFFF",
        "terminal-red": "#FF0000",
        "terminal-white": "#FFFFFF",
        "terminal-gray-dark": "#333333",
        "terminal-gray-darker": "#1A1A1A",
        "terminal-gray-muted": "#888888",
        "terminal-gray-text": "#666666",
        // Sector colors
        sector: {
          planning: "#6EE7B7",
          build: "#93C5FD",
          eval: "#FCA5A5",
          deploy: "#FDE68A",
        },
      },
      textShadow: {
        glow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 176, 0, 0.3)",
        "glow-bright": "0 0 10px rgba(0, 255, 0, 0.5)",
        "glow-cyan": "0 0 10px rgba(0, 255, 255, 0.5)",
      },
      boxShadow: {
        "glow-inset": "inset 0 0 20px rgba(255, 255, 255, 0.1)",
        "border-glow": "0 0 10px rgba(255, 176, 0, 0.3) inset",
      },
      letterSpacing: {
        terminal: "0.05em",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        ".text-glow": {
          textShadow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 176, 0, 0.3)",
        },
        ".text-glow-bright": {
          textShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
        },
        ".text-glow-cyan": {
          textShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
        },
        ".border-glow": {
          boxShadow: "0 0 10px rgba(255, 176, 0, 0.3) inset",
        },
      });
    },
  ],
};
export default config;

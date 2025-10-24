import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sector: {
          planning: "#6EE7B7",
          build: "#93C5FD",
          eval: "#FCA5A5",
          deploy: "#FDE68A",
        },
      },
    },
  },
  plugins: [],
};
export default config;

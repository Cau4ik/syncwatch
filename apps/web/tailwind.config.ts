import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111b",
        panel: "#0c1724",
        outline: "#1c2d3f",
        mist: "#8ba1ba",
        signal: "#7cf7d4",
        ember: "#ff865c",
        flare: "#ffd18c"
      },
      boxShadow: {
        soft: "0 20px 80px rgba(2, 8, 17, 0.35)",
        glow: "0 0 0 1px rgba(124, 247, 212, 0.12), 0 30px 80px rgba(7, 14, 26, 0.55)"
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top, rgba(124, 247, 212, 0.14), transparent 30%), linear-gradient(180deg, rgba(5, 11, 21, 0.35), rgba(5, 11, 21, 0.96))"
      }
    }
  },
  plugins: []
};

export default config;


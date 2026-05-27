import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sc: {
          orange: "#ff5500",
          "orange-dark": "#e64d00",
          dark: "#111111",
          "dark-2": "#1a1a1a",
          "dark-3": "#222222",
          "dark-4": "#333333",
          gray: "#999999",
          "gray-light": "#cccccc",
          "gray-dark": "#666666",
        },
      },
    },
  },
  plugins: [],
};

export default config;

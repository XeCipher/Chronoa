import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'serif'],
      },
      colors: {
        // These match the vars we put in globals.css
        sage: "rgb(var(--color-sage))",
        amber: "rgb(var(--color-amber))",
      }
    },
  },
  plugins: [],
};
export default config;
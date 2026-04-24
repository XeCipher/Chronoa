import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This tells Turbopack to "transpile" these packages properly
  transpilePackages: [
    '@tiptap/react', 
    '@tiptap/starter-kit', 
    '@tiptap/extension-bubble-menu',
    'react-activity-calendar' // <-- ADD THIS LINE
  ],
};

export default nextConfig;
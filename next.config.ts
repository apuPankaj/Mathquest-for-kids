import type { NextConfig } from "next";

// The game is published to GitHub Pages as plain files, at
// https://apupankaj.github.io/Mathquest-for-kids/ — so every address inside it
// has to start with /Mathquest-for-kids. The deploy workflow passes that prefix
// in as NEXT_PUBLIC_BASE_PATH; on your own computer it is empty, so
// `npm run dev` still opens at http://localhost:3000/.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;

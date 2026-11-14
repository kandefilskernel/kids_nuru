import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Par défaut, Next.js refuse les envois de plus de 1 Mo. Les dossiers et pièces jointes
    // vont jusqu'à 5 Mo (+ les champs du formulaire) : on laisse un peu de marge.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

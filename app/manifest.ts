import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FG Store",
    short_name: "FG Store",
    description:
      "Dokumentasi redeem GPT dan generator kode 2FA yang cepat, privat, dan nyaman digunakan.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#070914",
    theme_color: "#0b1020",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tutorial Redeem GPT",
        short_name: "Redeem GPT",
        description: "Buka panduan redeem GPT.",
        url: "/redeem-gpt#tutorial",
      },
      {
        name: "Generator 2FA",
        short_name: "2FA",
        description: "Buka generator kode authenticator yang berjalan lokal.",
        url: "/2fa",
      },
    ],
  };
}

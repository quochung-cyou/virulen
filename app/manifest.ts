import type { MetadataRoute } from "next"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "English Learning App",
    short_name: "EngLearn",
    description: "A Progressive Web App for learning English with object scanning.",
    start_url: "/virulen/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/virulen/placeholder-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/virulen/placeholder-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catecheo",
    short_name: "Catecheo",
    description:
      "OCIA participant and attendance management for Saint Bartholomew the Apostle Catholic Church",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#B8892B",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

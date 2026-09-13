export default function manifest() {
  return {
    name: "Bandhas & Nauli Kriya Workshop Registration",
    short_name: "Workshop Registration",
    description:
      "Register for the Bandhas & Nauli Kriya Workshop and securely complete your ₹19 workshop payment online.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#1A4D3E",
    icons: [
      {
        src: "/logo1.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo1.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

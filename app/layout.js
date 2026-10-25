import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "The Art of Breathing Workshop Registration",
  description:
    "Register for The Art of Breathing Workshop and secure your workshop seat online.",
  keywords: [
    "The Art of Breathing",
    "Pranayama",
    "Breathwork",
    "Yoga Workshop",
    "Kapalabhati",
    "Anulom Vilom",
    "Nadi Shodhana",
    "Diaphragmatic Breathing",
    "Vital Energy",
    "Mindfulness",
  ],
  openGraph: {
    title: "Master Your Breath, Transform Your Life - The Art of Breathing Workshop",
    description: "Online 90-Min Intensive Masterclass on Saturday, 31 October at 8:00 AM.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${plusJakartaSans.variable} ${playfairDisplay.variable}`}
    >
      <body className="bg-wellness-bg text-wellness-dark min-h-screen selection:bg-wellness-goldLight selection:text-wellness-primaryDark font-sans">
        {children}
      </body>
    </html>
  );
}

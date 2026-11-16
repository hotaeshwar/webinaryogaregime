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
  title: "Sampoorna Yoga – A Complete Yogic Journey | Yoga Regime",
  description:
    "Join our 1-month online Sampoorna Yoga Program with Harpreet Kaur. Explore Shatkarma, Asana, Pranayama, Mudra, Bandha & Meditation with recording access for self-practice.",
  keywords: [
    "Sampoorna Yoga",
    "Yoga Regime",
    "Harpreet Kaur",
    "Online Yoga Program",
    "Shatkarma",
    "Asana",
    "Pranayama",
    "Mudra",
    "Bandha",
    "Meditation",
    "Yogic Cleansing",
    "Breathwork",
  ],
  openGraph: {
    title: "Sampoorna Yoga – A Complete Yogic Journey",
    description: "1-Month Online Yoga Program • Mon, Wed & Fri (7:00 AM – 8:00 AM IST) • Yoga Regime",
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

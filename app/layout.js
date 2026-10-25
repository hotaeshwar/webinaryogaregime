import Script from "next/script";
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
    "Register for The Art of Breathing Workshop and securely complete your ₹1 workshop payment online.",
  keywords: [
    "The Art of Breathing",
    "Pranayama",
    "Breathwork",
    "Yoga Workshop",
    "Diaphragmatic Breathing",
    "Nadi Shodhana",
    "Mindfulness",
    "Stress Relief",
  ],
  openGraph: {
    title: "The Art of Breathing Workshop",
    description: "Online 90-Min Intensive Masterclass on Saturday, 31st October at 8:15 AM.",
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
        {/* Load Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

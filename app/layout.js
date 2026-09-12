import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Bandhas & Nauli Kriya Workshop Registration",
  description:
    "Register for the Bandhas & Nauli Kriya Workshop and securely complete your ₹1 workshop payment online.",
  keywords: [
    "Bandhas",
    "Nauli Kriya",
    "Yoga Workshop",
    "Mula Bandha",
    "Uddiyana Bandha",
    "Jalandhara Bandha",
    "Pranayama",
    "Core Strength",
  ],
  openGraph: {
    title: "Lock Your Energies, Unlock Your Strength - Bandhas & Nauli Kriya Workshop",
    description: "Online 90-Min Intensive Masterclass on Saturday, 19 September at 8:00 AM.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
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
